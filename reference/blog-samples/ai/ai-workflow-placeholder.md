---
archiveId: X-004
category: AI 实践
author: rndyt
title: "【示例】把 AI 放进代码审查循环"
description: "一个占位工作流：让 AI 提出可检验的假设，由人做取舍，再用测试结束循环。"
date: 2026-08-17
updated: 2026-08-18
tags: [workflow, code-review, verification]
featured: true
preview: true
kind: experiment
replay: true
series: ai-native-loop
seriesOrder: 2
---

> 这是预览站占位内容。下方 replay 只用于展示交互结构，不代表真实项目、真实数据或真实模型结果。

## 先定义循环

AI-native 不是把一段 Prompt 放在页面上，而是为一次工作循环留下可检查的输入和输出。这个示例把循环拆成四步：问题、AI 提议、人工判断、验证结果。

## 为什么要保留人工判断

模型可以帮助扩大候选空间，但它不知道哪些约束不能被破坏。人的工作不是替模型润色结论，而是决定哪些建议有资格进入代码和测试。

## 固定 replay

下面的演示使用固定数据，不调用外部模型。正式内容会替换主题、输入输出和验证结果。
