# Feasibility only, on MADE-UP data shaped like Table 1: can the range of results that a two-decimal
# table allows be found reliably? Nothing here reads the paper's data.
import numpy as np
from scipy.stats import chi2
Z = 1.959963984540054
def reml(y, v):
    t = max(0.0, np.var(y) - v.mean())
    for _ in range(500):
        w = 1/(v+t); sw = w.sum(); mu = (w*y).sum()/sw
        trP = sw - (w*w).sum()/sw
        trPP = (w*w).sum() - 2*(w**3).sum()/sw + ((w*w).sum()/sw)**2
        yPPy = ((w*(y-mu))**2).sum()
        new = max(0.0, t + (yPPy - trP)/trPP)
        if abs(new-t) < 1e-12: t = new; break
        t = new
    w = 1/(v+t); sw = w.sum(); mu = (w*y).sum()/sw; se = sw**-0.5
    wf = 1/v; muf = (wf*y).sum()/wf.sum(); Q = (wf*(y-muf)**2).sum()
    return np.array([mu, mu-Z*se, mu+Z*se, t, Q])
names = ["estimate","lower","upper","tau2","Q"]
rng = np.random.default_rng(20261024)
k = 63
def make():
    n = rng.choice([16,21,30,40,45,52,60,64,80,90,120,165,249,280,504], k)
    theta = rng.normal(0.02, np.sqrt(0.12), k)
    v = 4/n + theta**2/(2*n)
    d = theta + rng.normal(0, np.sqrt(v))
    zero = rng.choice(k, 7, replace=False); d[zero] = 0.0
    return d, v, zero
worst = np.zeros(5); worst_gap = np.zeros(5); truth_outside = 0
for rep in range(40):
    d, v, zero = make()
    truth = reml(d, v)
    dp, vp = np.round(d, 2), np.round(v, 2)
    vp = np.maximum(vp, 0.01)                      # nothing printed as .00 in the real table
    lo_d, hi_d = dp-0.005, dp+0.005; lo_d[zero] = hi_d[zero] = 0.0
    lo_v, hi_v = vp-0.005, vp+0.005
    centre = reml(dp, vp)
    # gradient at the centre by finite differences, then the corner each sign points to
    h = 1e-6; g = np.zeros((5, 2*k))
    for i in range(k):
        e = np.zeros(k); e[i] = h
        g[:, i] = (reml(dp+e, vp) - reml(dp-e, vp))/(2*h)
        g[:, k+i] = (reml(dp, vp+e) - reml(dp, vp-e))/(2*h)
    corner_lo, corner_hi = np.zeros(5), np.zeros(5)
    for j in range(5):
        for sgn, store in ((-1, corner_lo), (1, corner_hi)):
            pick = sgn*g[j] > 0
            dd = np.where(pick[:k], hi_d, lo_d); vv = np.where(pick[k:], hi_v, lo_v)
            store[j] = reml(dd, vv)[j]
    # random points in the box, as a check that nothing goes beyond the corners
    samp = np.array([reml(rng.uniform(lo_d, hi_d), rng.uniform(lo_v, hi_v)) for _ in range(3000)])
    beyond = np.maximum(corner_lo - samp.min(0), samp.max(0) - corner_hi)
    worst_gap = np.maximum(worst_gap, beyond)
    worst = np.maximum(worst, np.maximum(centre-corner_lo, corner_hi-centre))
    if np.any((truth < corner_lo-1e-9) | (truth > corner_hi+1e-9)): truth_outside += 1
print("40 made-up tables. Largest distance from the rounded table's own result to the edge of what rounding allows:")
for j in range(5): print(f"  {names[j]:9s} {worst[j]:.4f}   random points beyond the corner bound by at most {worst_gap[j]:.2e}")
print("tables whose true (unrounded) results fell outside the bounds:", truth_outside)
