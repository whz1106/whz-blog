---
title: MongoDB Atlas Vector Search 向量检索实战
slug: mongodb-atlas-vector-search
date: 2026-02-11 17:51:43
description: 使用 OpenRouter Embedding 和 MongoDB Atlas Vector Search，实现语义相似度检索。
categories:
  - MongoDB
tags:
  - MongoDB Atlas
  - Vector Search
  - 向量检索
  - Embedding
  - OpenRouter
---

## 0. 为什么需要向量检索

在之前的文章中，我们介绍了 MongoDB Atlas 的 BM25 全文检索能力。BM25 基于关键词匹配，适合精确查找。但当用户输入"怎么安装数据库"时，传统检索可能无法匹配到"MongoDB 部署教程"这样的语义相关内容。

向量检索（Vector Search）通过将文本转换为高维向量，计算语义相似度来解决这个问题。它能理解"安装"和"部署"、"数据库"和"MongoDB"之间的语义关联。

## 1. 技术栈

- **数据库**：MongoDB Atlas Local（Docker 部署）
- **Embedding 模型**：OpenRouter API 调用 `google/gemini-embedding-001`
- **Python 库**：
  - `pymongo`：MongoDB 驱动
  - `requests`：调用 OpenRouter API

## 2. 核心流程

1. **数据准备**：定义几条示例文本（技术 FAQ）
2. **生成向量**：调用 OpenRouter API，将文本转换为 3072 维 embedding 向量
3. **存储数据**：将文本和向量一起存入 MongoDB 集合
4. **创建索引**：使用 MongoDB 的 `create_search_index` 方法创建向量索引
5. **执行检索**：使用 `$vectorSearch` 聚合管道查询相似文本
6. **展示结果**：输出最相似的 Top-K 结果及相似度得分

## 3. 数据模型

### MongoDB 文档结构

```python
{
    "_id": ObjectId("..."),
    "question": "如何部署 MongoDB Atlas Local？",
    "answer": "使用 Docker Compose 可以快速部署...",
    "embedding": [0.123, -0.456, 0.789, ...]  # 3072 维向量
}
```

### 示例数据

```python
sample_data = [
    {
        "question": "如何部署 MongoDB Atlas Local？",
        "answer": "使用 Docker Compose 可以快速部署 MongoDB Atlas Local，需要配置持久化卷和环境变量。"
    },
    {
        "question": "什么是 BM25 算法？",
        "answer": "BM25 是一种基于概率的全文检索算法，广泛用于搜索引擎的相关性评分。"
    },
    {
        "question": "向量检索的原理是什么？",
        "answer": "向量检索通过计算查询向量和文档向量的相似度（如余弦相似度）来找到语义相关的内容。"
    },
    {
        "question": "如何优化数据库查询性能？",
        "answer": "可以通过创建索引、优化查询语句、使用连接池等方式提升数据库性能。"
    }
]
```

### 向量索引配置

```python
vector_index_definition = {
    "mappings": {
        "dynamic": True,  # 允许动态映射其他字段
        "fields": {
            "embedding": {
                "type": "knnVector",  # 向量类型
                "dimensions": 3072,    # gemini-embedding-001 的维度
                "similarity": "cosine" # 余弦相似度
            }
        }
    }
}
```

**注意**：Atlas Search 索引使用 `mappings` 结构，与普通 MongoDB 索引不同。

## 4. 聚合管道（Aggregation Pipeline）说明

聚合管道是 MongoDB 的数据处理框架，类似于 Unix 的管道操作。数据像流水线一样经过多个阶段，每个阶段对数据进行一种操作。

### 类比理解

```bash
# Unix 管道
cat file.txt | grep "error" | sort | head -10

# MongoDB 聚合管道
collection.aggregate([
    {"$match": ...},      # 相当于 grep（过滤）
    {"$sort": ...},       # 相当于 sort（排序）
    {"$limit": 10}        # 相当于 head（限制数量）
])
```

### 在向量检索中的应用

```python
pipeline = [
    # 第一阶段：向量搜索（找到相似的文档）
    {
        "$vectorSearch": {
            "index": "vector_index",
            "path": "embedding",
            "queryVector": [0.1, 0.2, ...],  # 查询向量
            "numCandidates": 100,
            "limit": 3
        }
    },
    # 第二阶段：投影（选择要返回的字段）
    {
        "$project": {
            "question": 1,
            "answer": 1,
            "score": {"$meta": "vectorSearchScore"}  # 添加相似度得分
        }
    }
]
```

## 5. 完整 Python 实现

```python
import requests
from pymongo import MongoClient
import time

# ============ 配置部分 ============
OPENROUTER_API_KEY = "your_api_key_here"  # 替换为你的 OpenRouter API key
MONGO_URI = "mongodb://admin:password@localhost:27017/"
DATABASE_NAME = "vector_search_demo"
COLLECTION_NAME = "tech_qa"

# ============ 示例数据 ============
sample_data = [
    {
        "question": "如何部署 MongoDB Atlas Local？",
        "answer": "使用 Docker Compose 可以快速部署 MongoDB Atlas Local，需要配置持久化卷和环境变量。"
    },
    {
        "question": "什么是 BM25 算法？",
        "answer": "BM25 是一种基于概率的全文检索算法，广泛用于搜索引擎的相关性评分。"
    },
    {
        "question": "向量检索的原理是什么？",
        "answer": "向量检索通过计算查询向量和文档向量的相似度（如余弦相似度）来找到语义相关的内容。"
    },
    {
        "question": "如何优化数据库查询性能？",
        "answer": "可以通过创建索引、优化查询语句、使用连接池等方式提升数据库性能。"
    }
]

# ============ 核心函数 ============

def get_embedding(text: str, api_key: str) -> list:
    """
    调用 OpenRouter API 生成文本的 embedding 向量

    Args:
        text: 要向量化的文本
        api_key: OpenRouter API key

    Returns:
        长度为 3072 的向量列表
    """
    url = "https://openrouter.ai/api/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "google/gemini-embedding-001",
        "input": text
    }

    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()["data"][0]["embedding"]


def insert_documents_with_embeddings(collection, documents: list, api_key: str):
    """
    为文档生成 embedding 并批量插入 MongoDB

    Args:
        collection: MongoDB 集合对象
        documents: 文档列表
        api_key: OpenRouter API key
    """
    for doc in documents:
        # 合并 question 和 answer 作为向量化的文本
        text = f"{doc['question']} {doc['answer']}"
        print(f"正在生成 embedding: {doc['question'][:30]}...")
        doc["embedding"] = get_embedding(text, api_key)

    collection.insert_many(documents)
    print(f"✓ 成功插入 {len(documents)} 条文档")


def create_vector_index(collection):
    """
    创建 MongoDB 向量搜索索引

    参考文档：https://www.mongodb.com/docs/atlas/atlas-vector-search/create-index/

    注意：
    1. 此方法需要 MongoDB Atlas 或 Atlas Local 支持
    2. Atlas Search 索引使用 mappings 字段（不是 fields）
    3. 索引创建是异步的，需要等待构建完成
    """
    # 定义向量索引配置（Atlas Search 格式）
    index_definition = {
        "mappings": {
            "dynamic": True,
            "fields": {
                "embedding": {
                    "type": "knnVector",
                    "dimensions": 3072,
                    "similarity": "cosine"
                }
            }
        }
    }

    try:
        # 创建向量搜索索引
        result = collection.create_search_index(
            {"definition": index_definition, "name": "vector_index"}
        )
        print(f"✓ 向量索引 '{result}' 创建成功")

        # 等待索引构建完成
        print("⏳ 等待索引构建完成...")
        max_wait_time = 60  # 最多等待 60 秒
        elapsed_time = 0

        while elapsed_time < max_wait_time:
            try:
                indices = list(collection.list_search_indexes(result))
                if len(indices) and indices[0].get("queryable") is True:
                    print(f"✓ 索引 '{result}' 已就绪，可以查询")
                    return
            except Exception as e:
                print(f"检查索引状态时出错: {e}")

            time.sleep(5)
            elapsed_time += 5

        print(f"⚠️  索引创建超时，但可能仍在后台构建中")

    except Exception as e:
        print(f"❌ 创建索引失败: {e}")
        print("提示：请检查 MongoDB Atlas Local 是否正确配置")
        raise


def vector_search(collection, query_text: str, api_key: str, limit: int = 3) -> list:
    """
    执行向量相似度检索

    Args:
        collection: MongoDB 集合对象
        query_text: 查询文本
        api_key: OpenRouter API key
        limit: 返回结果数量

    Returns:
        检索结果列表，包含 question、answer 和相似度 score
    """
    # 1. 生成查询文本的 embedding
    query_embedding = get_embedding(query_text, api_key)

    # 2. 使用 $vectorSearch 聚合管道进行检索
    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index",           # 索引名称
                "path": "embedding",               # 向量字段路径
                "queryVector": query_embedding,    # 查询向量
                "numCandidates": 100,              # 候选文档数量
                "limit": limit                     # 返回结果数量
            }
        },
        {
            "$project": {
                "_id": 0,
                "question": 1,
                "answer": 1,
                "score": {"$meta": "vectorSearchScore"}  # 获取相似度得分
            }
        }
    ]

    results = list(collection.aggregate(pipeline))
    return results


# ============ 主流程 ============

def main():
    """主函数：完整的向量检索演示流程"""

    # 1. 连接 MongoDB
    print("=" * 60)
    print("MongoDB Atlas Vector Search 演示")
    print("=" * 60)
    print("\n[1/5] 连接 MongoDB...")
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]
    print("✓ 连接成功")

    # 2. 清空旧数据（可选）
    print("\n[2/5] 清空旧数据...")
    collection.drop()
    print("✓ 集合已清空")

    # 3. 插入文档并生成向量
    print("\n[3/5] 生成 embeddings 并插入文档...")
    insert_documents_with_embeddings(collection, sample_data, OPENROUTER_API_KEY)

    # 4. 创建向量索引
    print("\n[4/5] 创建向量索引...")
    create_vector_index(collection)

    # 5. 执行检索测试
    print("\n[5/5] 执行向量检索测试")
    print("=" * 60)

    test_queries = [
        "怎么安装数据库？",
        "搜索算法有哪些？",
        "提升查询速度的方法"
    ]

    for query in test_queries:
        print(f"\n📝 查询: {query}")
        print("-" * 60)
        results = vector_search(collection, query, OPENROUTER_API_KEY)

        for i, result in enumerate(results, 1):
            print(f"{i}. [相似度: {result['score']:.4f}] {result['question']}")
            print(f"   {result['answer'][:60]}...")

    print("\n" + "=" * 60)
    print("✓ 演示完成")
    print("=" * 60)


if __name__ == "__main__":
    main()
```

## 6. 使用步骤

### 环境准备

```bash
# 1. 安装依赖
pip install pymongo requests

# 2. 确保 MongoDB Atlas Local 已启动
docker compose ps

# 3. 获取 OpenRouter API key
# 访问 https://openrouter.ai/ 注册并获取 API key
```

### 运行脚本

```bash
# 1. 替换脚本中的 OPENROUTER_API_KEY
# 2. 确认 MONGO_URI 连接信息正确
# 3. 运行
python vector_search.py
```

### 预期输出

```
============================================================
MongoDB Atlas Vector Search 演示
============================================================

[1/5] 连接 MongoDB...
✓ 连接成功

[2/5] 清空旧数据...
✓ 集合已清空

[3/5] 生成 embeddings 并插入文档...
正在生成 embedding: 如何部署 MongoDB Atlas Local？...
正在生成 embedding: 什么是 BM25 算法？...
正在生成 embedding: 向量检索的原理是什么？...
正在生成 embedding: 如何优化数据库查询性能？...
✓ 成功插入 4 条文档

[4/5] 创建向量索引...
✓ 向量索引 'vector_index' 创建成功
⏳ 等待索引构建完成...
✓ 索引 'vector_index' 已就绪，可以查询

[5/5] 执行向量检索测试
============================================================

📝 查询: 怎么安装数据库？
------------------------------------------------------------
1. [相似度: 0.8314] 如何优化数据库查询性能？
   可以通过创建索引、优化查询语句、使用连接池等方式提升数据库性能。...
2. [相似度: 0.7946] 如何部署 MongoDB Atlas Local？
   使用 Docker Compose 可以快速部署 MongoDB Atlas Local，需要配置持久化卷和环境变量。...
3. [相似度: 0.7538] 什么是 BM25 算法？
   BM25 是一种基于概率的全文检索算法，广泛用于搜索引擎的相关性评分。...

📝 查询: 搜索算法有哪些？
------------------------------------------------------------
1. [相似度: 0.8449] 什么是 BM25 算法？
   BM25 是一种基于概率的全文检索算法，广泛用于搜索引擎的相关性评分。...
2. [相似度: 0.7928] 如何优化数据库查询性能？
   可以通过创建索引、优化查询语句、使用连接池等方式提升数据库性能。...
3. [相似度: 0.7861] 向量检索的原理是什么？
   向量检索通过计算查询向量和文档向量的相似度（如余弦相似度）来找到语义相关的内容。...

📝 查询: 提升查询速度的方法
------------------------------------------------------------
1. [相似度: 0.9005] 如何优化数据库查询性能？
   可以通过创建索引、优化查询语句、使用连接池等方式提升数据库性能。...
2. [相似度: 0.7860] 向量检索的原理是什么？
   向量检索通过计算查询向量和文档向量的相似度（如余弦相似度）来找到语义相关的内容。...
3. [相似度: 0.7830] 什么是 BM25 算法？
   BM25 是一种基于概率的全文检索算法，广泛用于搜索引擎的相关性评分。...

============================================================
✓ 演示完成
============================================================
```

## 7. 关键技术点

### 7.1 为什么选择余弦相似度？

余弦相似度（cosine similarity）计算两个向量之间的夹角余弦值，范围在 -1 到 1 之间。它不受向量长度影响，只关注方向，适合文本语义相似度计算。

### 7.2 numCandidates 参数的作用

`numCandidates` 指定在精确计算相似度前，先用近似算法筛选出的候选文档数量。设置为 100 表示先从所有文档中快速筛选出 100 个可能相关的候选，再精确计算相似度并返回 Top-K。

### 7.3 索引创建时间

向量索引创建是异步的，需要等待几秒钟才能使用。生产环境中应该通过 MongoDB Atlas UI 或 API 检查索引状态。

## 8. 与 BM25 的对比


| 特性   | BM25 全文检索    | Vector Search 向量检索 |
| ---- | ------------ | ------------------ |
| 匹配方式 | 关键词精确匹配      | 语义相似度匹配            |
| 分词依赖 | 需要（如 jieba）  | 不需要                |
| 查询示例 | "MongoDB 部署" | "怎么安装数据库"          |
| 适用场景 | 精确查找、关键词搜索   | 语义搜索、问答系统          |
| 索引大小 | 较小           | 较大（存储向量）           |
| 查询速度 | 快            | 稍慢（需计算相似度）         |


## 9. 生产化建议

1. **API key 管理**：使用环境变量或密钥管理服务，不要硬编码
2. **错误处理**：添加 API 调用失败重试、超时处理
3. **批量处理**：大量文档时分批生成 embedding，避免 API 限流
4. **索引监控**：定期检查索引状态和查询性能
5. **混合检索**：结合 BM25 和向量检索，取两者优势

## 10. 参考链接

- MongoDB Vector Search 官方文档：[https://www.mongodb.com/docs/atlas/atlas-vector-search/](https://www.mongodb.com/docs/atlas/atlas-vector-search/)
- OpenRouter API 文档：[https://openrouter.ai/docs](https://openrouter.ai/docs)
- Gemini Embedding 模型：[https://ai.google.dev/gemini-api/docs/embeddings](https://ai.google.dev/gemini-api/docs/embeddings)
