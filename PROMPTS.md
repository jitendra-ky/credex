## AI Spend Audit - Summary Generation Prompt

**Tool Used:** Google Gemini 1.5 Flash (via `@google/generative-ai`)
**Task:** Generate a personalized 100-word summary of the user's AI spend audit results.

### The Prompt Template

```text
You are an expert SaaS procurement consultant specializing in AI infrastructure spend. 
Based on the following audit of a company's AI tools, write a personalized, highly professional, 
and concise summary (around 100 words) of their savings opportunities. 

If they have high savings (>$500/mo), adopt an urgent but professional tone.
If they are already optimal, congratulate them on running a tight ship.
Focus on the most significant findings. Do not hallucinate numbers. Use the data provided.

Context:
Team Size: {{team_size}}
Primary Use Case: {{use_case}}
Total Monthly Savings Found: ${{monthly_savings}}

Key Findings:
{{findings_list}}

Summary:
```

### Why I wrote it this way
- **Persona:** Setting the persona to "expert SaaS procurement consultant" sets the right tone for B2B communication.
- **Constraints:** Explicitly asking for ~100 words and instructing not to hallucinate numbers ensures the output is safe and fits the UI perfectly.
- **Conditional Tone:** Instructing the model to change tone based on savings aligns with the product's goal (creating urgency for high savings, or building trust with optimal spenders).

### What I tried that didn't work
- Initially, I didn't include the specific findings in the prompt and just passed the tool names. The LLM ended up hallucinating reasons for savings that didn't match the actual hardcoded deterministic rules. Injecting the exact findings list fixes this.
