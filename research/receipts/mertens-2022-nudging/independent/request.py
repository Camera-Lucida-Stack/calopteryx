"""Asks a model of another family (OpenAI GPT-6.1 Sol, through OpenRouter) for its own implementation of the two models,
from PLAN.md's text alone, without sight of run.R or compare.R (PLAYBOOK.md, statistical practice 7). Saves the prompt,
the reply and the code in this folder, and logs the cost in records/costs/reviews.csv. Run from the checkout's root:
    python3 research/receipts/mertens-2022-nudging/independent/request.py
"""
import datetime, json, os, re, sys, time, urllib.request

HERE = "research/receipts/mertens-2022-nudging"
MODEL = "openai/gpt-6.1-sol"
plan = open(f"{HERE}/PLAN.md", encoding="utf-8").read()
method = plan[plan.index("## Method"):plan.index("**Outputs**")]

prompt = f"""You are writing an independent implementation of two meta-analytic models, to be compared with another
implementation that you will not see. Work only from the specification below, which is an extract from a
pre-registration. The models are those of the R package metafor, version 3.0-2: implement what that version computes,
from your own knowledge of its documented methods.

SPECIFICATION (extract):
{method}

THE TWO MODELS, as the authors' script fits them:
  primary <- rma.mv(cohens_d, variance_d, data = df, random = ~ 1 | publication_id/es_id, tdist = TRUE)
  primary_robust <- robust(primary, cluster = df$study_id)
  domain <- rma.mv(cohens_d, variance_d, mods = ~ factor(domain) + scale(year) - 1, data = df,
                   random = ~ 1 | publication_id/es_id, tdist = TRUE)
  domain_robust <- robust(domain, cluster = df$study_id, adjust = TRUE)
rma.mv uses restricted maximum likelihood by default.

WHAT TO WRITE: one Python 3 program using only the standard library, numpy and scipy. It takes two arguments, the path
of a CSV file and the path of a JSON file to write. The CSV may begin with a byte-order mark and may have Windows line
ends; its columns include publication_id, study_id, es_id, year, domain (text: health, food, environment, finance,
pro-social, other), cohens_d and variance_d (variance_d may be written in E notation), and other columns to ignore;
missing values are written NA. Write a JSON object with: k_primary, k_domain, and for each figure in overall, health,
food, environment, finance, prosocial, other: est_<figure> and hw_<figure>, where hw is half the width of the 95%
confidence interval of the cluster-robust result. Also report sigma2_primary (the two variance components) for
diagnosis. No randomness. Reply with the program only, in one ```python block, then a short list of any assumptions
you made about what metafor 3.0-2 computes."""

key = os.environ["OPENROUTER_API_KEY"]
req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions", method="POST",
    headers={"authorization": f"Bearer {key}", "content-type": "application/json"},
    data=json.dumps({"model": MODEL, "messages": [{"role": "user", "content": prompt}], "usage": {"include": True}}).encode())
j = json.load(urllib.request.urlopen(req, timeout=900))
text = j["choices"][0]["message"]["content"]
usage = j.get("usage", {})
cost = usage.get("cost")
for _ in range(5):
    if cost is not None or not j.get("id"):
        break
    time.sleep(2)
    g = urllib.request.Request(f"https://openrouter.ai/api/v1/generation?id={j['id']}", headers={"authorization": f"Bearer {key}"})
    try:
        cost = json.load(urllib.request.urlopen(g, timeout=60)).get("data", {}).get("total_cost")
    except Exception:
        pass
at = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
open(f"{HERE}/independent/prompt.txt", "w", encoding="utf-8").write(prompt)
open(f"{HERE}/independent/reply.md", "w", encoding="utf-8").write(text)
code = re.search(r"```python\n(.*?)```", text, re.S)
if code:
    open(f"{HERE}/independent/independent.py", "w", encoding="utf-8").write(code.group(1))
with open("records/costs/reviews.csv", "a", encoding="utf-8") as f:
    f.write(f"{at},mertens-2022-receipt,independent,{MODEL},{usage.get('prompt_tokens', 0)},{usage.get('completion_tokens', 0)},{cost if cost is not None else ''},{j.get('id', '')}\n")
print("cost", cost, "code saved" if code else "NO CODE BLOCK in the reply")
