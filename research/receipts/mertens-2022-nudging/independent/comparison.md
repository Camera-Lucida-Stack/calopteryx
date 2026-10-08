# Independent implementation: comparison on synthetic data

8 October 2026. OpenAI GPT-6.1 Sol (openrouter: openai/gpt-6.1-sol) wrote independent.py from PLAN.md's Method section and the two model calls alone, without sight of run.R or compare.R (prompt.txt, reply.md; cost $0.04972, logged in records/costs/reviews.csv). Both were run on the same synthetic data, made by synth.R (447 rows, 212 publications; SHA-256 957f0c4414a713c48246c19b1be069df3119e874868cfe3cca7100a759eecf96): run.R in the pinned image through test.sh, running the authors' script with metafor 3.0-2; independent.py with Python 3, numpy and scipy. The real data were never used.

Counts: k_primary 447 and 447; k_domain 447 and 447. Largest difference in any estimate or half-width: 1.8e-10.

| Output | run.R (metafor 3.0-2) | independent.py | Difference |
|---|---|---|---|
| est_overall | 0.375038829 | 0.375038829 | 1.8e-10 |
| hw_overall | 0.029258788 | 0.029258788 | 1.2e-10 |
| est_health | 0.288253540 | 0.288253540 | 3.2e-13 |
| hw_health | 0.068709608 | 0.068709608 | 2.0e-12 |
| est_food | 0.622043258 | 0.622043258 | 9.4e-12 |
| hw_food | 0.061627311 | 0.061627311 | 4.6e-12 |
| est_environment | 0.416839549 | 0.416839549 | 8.0e-12 |
| hw_environment | 0.065432466 | 0.065432466 | 1.6e-12 |
| est_finance | 0.183522205 | 0.183522205 | 2.6e-12 |
| hw_finance | 0.059854301 | 0.059854301 | 2.0e-12 |
| est_prosocial | 0.365546334 | 0.365546334 | 2.2e-12 |
| hw_prosocial | 0.064038321 | 0.064038321 | 5.7e-12 |
| est_other | 0.397743302 | 0.397743302 | 2.1e-13 |
| hw_other | 0.050807087 | 0.050807087 | 2.4e-13 |

The agreement confirms that run.R reads the intended quantities from the two models (each domain row at the mean publication year; robust() with and without its small-sample adjustment), as the plan describes.
