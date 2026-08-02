---
title: MongoDB Atlas Search BM25 全文检索实战：基于 jieba 分词的中文搜索方案
slug: mongodb-atlas-bm25-search
date: 2026-02-10 19:43:51
description: 基于 jieba 应用层分词、Atlas whitespace analyzer 和 BM25，搭建中文全文检索方案。
categories:
  - MongoDB
tags:
  - MongoDB Atlas
  - Atlas Search
  - BM25
  - jieba
  - 全文检索
---

## 前言

在上一篇《MongoDB Atlas Local Docker 快速部署》中，我们成功在本地搭建了 MongoDB Atlas 环境。本文将在此基础上，实现一个适合中文场景的全文检索方案。

MongoDB Atlas Search 内置了基于 Apache Lucene 的 BM25 算法，但其默认分析器对中文支持不佳（会按字符分词）。本文介绍一种巧妙的解决方案：使用 jieba 在应用层完成中文分词，然后利用 Atlas Search 的 whitespace analyzer 和 BM25 算法完成检索。

## 技术方案概述

我们的方案分为两个层次：

**应用层（Python）：**

- 使用 jieba 对中文文本进行分词
- 将分词结果用空格连接，存储到 MongoDB 的专用字段

**数据库层（MongoDB Atlas Search）：**

- 在分词字段上创建搜索索引（使用 whitespace analyzer）
- Atlas Search 自动构建倒排索引
- 利用内置的 BM25 算法进行相关性排序

**数据结构示例：**

```python
{
    "_id": ObjectId("..."),
    "title": "机器学习入门教程",
    "content": "本文介绍机器学习的基础知识...",
    "content_segmented": "本文 介绍 机器 学习 的 基础知识 ..."  # jieba 分词后
}
```

## 倒排索引原理

当我们在 `content_segmented` 字段上创建 Atlas Search 索引时，MongoDB 会构建倒排索引（Inverted Index）：

```
词项(Term)     → 文档列表(Document IDs)
"机器"         → [doc1, doc3, doc5]
"学习"         → [doc1, doc2, doc5]
"基础知识"     → [doc1, doc4]
```

这样查询时可以快速定位包含特定词的文档，而不需要扫描全部数据。

## 全文检索流程

1. **查询分词**：用户输入"机器学习" → jieba 分词 → ["机器", "学习"]
2. **倒排查找**：在倒排索引中查找包含这些词的文档
3. **BM25 评分**：根据词频(TF)、逆文档频率(IDF)、文档长度等计算相关性分数
4. **结果排序**：按 BM25 分数降序返回最相关的文档

## 索引设计说明

你可以根据需求创建多个索引：

- **单字段索引**：只对 `content_segmented` 建索引
- **多字段索引**：同时对 `title_segmented` 和 `content_segmented` 建索引，可设置不同权重

本文以单字段索引为例进行演示。

## 环境准备

基于上一篇的 Docker 环境，安装必要的 Python 依赖：

```bash
uv pip install jieba pymongo
```

## 步骤一：使用 jieba 分词并存储数据

```python
import jieba
from pymongo import MongoClient

# 连接 MongoDB（基于上一篇的 Docker 部署）
client = MongoClient("mongodb://localhost:27017/")   # 数据库url
db = client["search_demo"]     # 数据库名字
collection = db["articles"]     # 集合名字

# 示例文档
documents = [
    {
        "title": "机器学习入门教程",
        "content": "机器学习是人工智能的一个分支，它让计算机能够从数据中学习规律。"
    },
    {
        "title": "深度学习实战",
        "content": "深度学习是机器学习的子领域，使用神经网络进行特征学习。"
    },
    {
        "title": "自然语言处理技术",
        "content": "自然语言处理让计算机能够理解和生成人类语言。"
    }
]

# 使用 jieba 分词并存储
for doc in documents:
    # 对 content 进行分词
    content_segmented = " ".join(jieba.cut(doc["content"]))

    # 插入文档（包含原文和分词结果）
    collection.insert_one({
        "title": doc["title"],
        "content": doc["content"],
        "content_segmented": content_segmented
    })

print("数据插入完成！")
```

**分词结果示例：**

```
原文: "机器学习是人工智能的一个分支"
分词: "机器 学习 是 人工智能 的 一个 分支"
```

## 步骤二：创建 Atlas Search 索引

```python
# 定义索引映射（使用 whitespace analyzer）
mappings = {
    "dynamic": False,  # 只索引明确指定的字段
    "fields": {
        "content_segmented": {
            "type": "string",
            "analyzer": "lucene.whitespace"  # 使用空格分词器
        }
    }
}

# 创建搜索索引
result = db.command(
    "createSearchIndexes",
    "articles",  # 集合名称
    indexes=[{
        "name": "content_search_index",
        "definition": {
            "mappings": mappings
        }
    }]
)

print(f"索引创建成功: {result}")
```

**索引配置说明：**

- `dynamic: False`：只索引明确指定的字段，提高效率
- `lucene.whitespace`：按空格分词，完美适配 jieba 的分词结果
- 索引构建后，MongoDB 会自动生成倒排索引，支持 BM25 检索

**查看索引状态：**

```python
# 查看所有 Atlas Search 索引
search_indexes = list(collection.list_search_indexes())

print(f"Atlas Search 索引数量: {len(search_indexes)}")
print("\n索引详情:")
for idx in search_indexes:
    print(f"- 索引名称: {idx['name']}")
    print(f"  状态: {idx.get('status', 'N/A')}")
    print(f"  类型: {idx.get('type', 'search')}")
```

**输出示例：**

```
Atlas Search 索引数量: 1

索引详情:
- 索引名称: content_search_index
  状态: READY
  类型: search
```

**注意：** 索引状态为 `READY` 时才能正常使用，初次创建可能需要等待几秒到几分钟。

## 步骤三：执行 BM25 全文检索

```python
# 查询函数
def search_articles(query_text):
    # 1. 对查询文本进行 jieba 分词
    query_segmented = " ".join(jieba.cut(query_text))
    print(f"查询分词结果: {query_segmented}")

    # 2. 构建 Atlas Search 聚合管道
    pipeline = [
        {
            "$search": {
                "index": "content_search_index",  # 使用创建的索引
                "text": {
                    "query": query_segmented,
                    "path": "content_segmented"
                }
            }
        },
        {
            "$project": {
                "title": 1,
                "content": 1,
                "score": {"$meta": "searchScore"}  # 获取 BM25 分数
            }
        },
        {
            "$limit": 10  # 返回前 10 条结果
        }
    ]

    # 3. 执行查询
    results = collection.aggregate(pipeline)

    # 4. 输出结果
    print("\n搜索结果：")
    for i, doc in enumerate(results, 1):
        print(f"{i}. [分数: {doc['score']:.4f}] {doc['title']}")
        print(f"   {doc['content']}\n")

# 示例查询
search_articles("机器学习")
```

**查询结果示例：**

```
查询分词结果: 机器 学习

搜索结果：
1. [分数: 0.5458] 深度学习实战
   深度学习是机器学习的子领域，使用神经网络进行特征学习。

2. [分数: 0.4716] 机器学习入门教程
   机器学习是人工智能的一个分支，它让计算机能够从数据中学习规律。
```

**BM25 评分说明：**

- 分数越高表示相关性越强
- 评分考虑了词频（TF）、逆文档频率（IDF）和文档长度归一化
- Atlas Search 自动使用 BM25 算法，无需额外配置

## 完整示例代码

```python
import jieba
from pymongo import MongoClient

# 连接 MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["search_demo"]
collection = db["articles"]

# 1. 插入数据（带 jieba 分词）
def insert_documents():
    documents = [
        {
            "title": "机器学习入门教程",
            "content": "机器学习是人工智能的一个分支，它让计算机能够从数据中学习规律。"
        },
        {
            "title": "深度学习实战",
            "content": "深度学习是机器学习的子领域，使用神经网络进行特征学习。"
        },
        {
            "title": "自然语言处理技术",
            "content": "自然语言处理让计算机能够理解和生成人类语言。"
        }
    ]

    for doc in documents:
        content_segmented = " ".join(jieba.cut(doc["content"]))
        collection.insert_one({
            "title": doc["title"],
            "content": doc["content"],
            "content_segmented": content_segmented
        })

    print("数据插入完成！")

# 2. 创建搜索索引
def create_search_index():
    mappings = {
        "dynamic": False,
        "fields": {
            "content_segmented": {
                "type": "string",
                "analyzer": "lucene.whitespace"
            }
        }
    }

    result = db.command(
        "createSearchIndexes",
        "articles",
        indexes=[{
            "name": "content_search_index",
            "definition": {
                "mappings": mappings
            }
        }]
    )

    print(f"索引创建成功: {result}")

# 3. 执行搜索
def search_articles(query_text):
    query_segmented = " ".join(jieba.cut(query_text))
    print(f"查询分词结果: {query_segmented}")

    pipeline = [
        {
            "$search": {
                "index": "content_search_index",
                "text": {
                    "query": query_segmented,
                    "path": "content_segmented"
                }
            }
        },
        {
            "$project": {
                "title": 1,
                "content": 1,
                "score": {"$meta": "searchScore"}
            }
        },
        {
            "$limit": 10
        }
    ]

    results = collection.aggregate(pipeline)

    print("\n搜索结果：")
    for i, doc in enumerate(results, 1):
        print(f"{i}. [分数: {doc['score']:.4f}] {doc['title']}")
        print(f"   {doc['content']}\n")

# 执行流程
if __name__ == "__main__":
    # 步骤 1: 插入数据
    insert_documents()

    # 步骤 2: 创建索引
    create_search_index()

    # 步骤 3: 执行搜索
    search_articles("机器学习")
```

### 扩展阅读

- [MongoDB Atlas Search 官方文档](https://www.mongodb.com/docs/atlas/atlas-search/)
- [jieba 中文分词](https://github.com/fxsjy/jieba)
- [BM25 算法原理](https://en.wikipedia.org/wiki/Okapi_BM25)

---

**相关文章：**

- 上一篇：MongoDB Atlas Local Docker 快速部署
