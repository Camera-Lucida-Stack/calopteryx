# Reading notes: the authors' files (step 1 of the plan in SCOPING.md)

Done on 24 October 2026. Files fetched from OSF project us9c7 through the OSF API; each fingerprint matched the sha256 OSF records for it. No data values were read: only the CSV's header line and the data dictionary.

| File (OSF path) | Download | Bytes | sha256 | Last modified on OSF |
|---|---|---|---|---|
| /Stage_2/Data/DISI_Core_Dataset.csv | https://osf.io/download/5nwq2/ | 82,692 | 846b9cd79764c198a5e008155cb1c9d02b008394f3452e0ac7d6a9c0a63fda0f | 2025-02-14 |
| /Stage_2/Data/DISI Core Dataset Data Dictionary.xlsx | https://osf.io/download/6f5bh/ | 10,905 | 454cad06975155268c72d2904581740b793c34de2cb321cb38bea49c036a384a | 2024-10-21 |
| /Stage_2/Scripts/DISI_InformationTransfer_Analysis_NoCovariates.Rmd | https://osf.io/download/52y8p/ | 25,032 | 71446e02566b273c75ffb7e2a708e84b2379aafdd08b0a36b2024e0f7c842e5c | 2025-02-14 |
| /Stage_2/Scripts/DISI_InformationTransfer_Analysis_Covariates.Rmd | https://osf.io/download/h8gte/ | 25,844 | ab946e3561dd55aa7f1cb2fefb0ce6af333b14d0f1cb50da0ec3b0de3581824f | 2025-02-14 |

All were last modified before the paper's publication (14 May 2025). The OSF project sets no licence, so the files are to be named by fingerprint and fetched from source, never copied.

## The data file

47 columns. The analysis of information transfer needs eight: Site, Diffusion_Chain_Number, Diffusion_Chain_Type, Blinding_Condition, Which_Task_Goes_First, Order_In_Chain, Fictional_Story_Score and Factual_Story_Score. The others hold personal details (age, gender, ethnicity, age at diagnosis, autism measures, IQ) and rapport ratings; none is needed, and none is to be read. The data dictionary's definitions sit one row below the variables they describe (for example, "Site name" stands against Diffusion_Chain_Number); this is a presentation slip in the dictionary and does not affect the analysis.

## The analysis of record

DISI_InformationTransfer_Analysis_NoCovariates.Rmd (author Martin Lages, dated 14 August 2024) fits, for each story, the model the paper reports in its Results:

- fictional: `lmer(Fictional_Story_Score ~ chain_type * log(order) + site * info * first + (1 + log(order) | number), data = df)`, reported with `summary(fi2, ddf = "Satterthwaite")` and `anova(fi2, type = 3)`;
- factual: the same model for Factual_Story_Score (`fa2`).

chain_type is re-levelled so that non-autistic chains are the reference (`relevel(chain_type, ref = 3)`), so the model's coefficients compare autistic chains and mixed chains each with non-autistic chains. Mixed chains are not compared directly with autistic chains in this script. The script's text agrees with the paper: in the fictional story, only log(order), the unpredicted autistic-by-log(order) interaction and the control variable first are significant; in the factual story, only log(order).

Points for drafting:

1. The script sets its working directory through RStudio (`rstudioapi`), so a re-run outside RStudio needs that one line replaced; the model calls themselves can be run unchanged.
2. The Bayes factors in the paper are not computed in this script; they come from BayesFactor's random sampling and would vary slightly between runs.
3. The script loads several packages the two models do not need (brms needs a compiler); a test should name the model calls, not the whole file, as for Jachimowicz.
4. The paper reports the coefficients for log(order) and for the autistic interaction, but not those for mixed chains. The Supplementary Information (MOESM1, 10 pages, read 24 October 2026) does not give them either: for the multilevel models it says only that there were no significant differences in task performance across chain types, apart from the autistic-by-log(order) interaction in the fictional story.
