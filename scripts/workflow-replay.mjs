// Fixed demonstration carried over from the existing blog's article component.
export const replayMarkdown = `
### 01 / define · 定义问题

示例：一段 Java service 在高峰期重复读取同一份配置。目标是找出可复现的风险并给出最小改动建议。

\`\`\`text
input/problem.md
context: repeated config reads
constraint: preserve public API
question: where is the avoidable work?
\`\`\`

### 02 / propose · 提出假设

模型标出调用链、列出可能的缓存边界，并把不确定的地方写成待验证假设。

\`\`\`text
model/proposal.txt
assumption A: config lookup is request-invariant
assumption B: local cache lifetime is bounded
confidence: medium
\`\`\`

### 03 / review · 人工判断

人工检查配置的生命周期、并发语义和异常路径，只采纳不改变外部契约的部分。

\`\`\`text
review/decision.md
accept: memoize lookup per request
reject: global cache without invalidation
reason: ownership and staleness risk
\`\`\`

### 04 / verify · 验证结果

补充回归测试，再用固定输入记录基准结果。以下输出均为示例，不代表实际项目的验证结果。

\`\`\`text
verification/result.txt
regression: passing (sample)
benchmark: captured (sample)
next: compare under production-like load
\`\`\`
`;
