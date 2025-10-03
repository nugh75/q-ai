# 📊 Piano di Miglioramento Analisi Statistica e Visualizzazione Dati

**Progetto**: CNR Questionari AI - Analisi Comparativa Studenti/Insegnanti
**Data Analisi**: 2 Ottobre 2025
**Dataset**: 270 Studenti + 455 Insegnanti (356 attivi)
**Prospettiva**: Ricerca Scientifica + User Experience

---

## 🔬 Executive Summary - Prospettiva Scientifica

### Dataset Overview
```
Studenti:        n=270 (età media 21 anni, range 14-58)
Insegnanti:      n=455 (356 attivi, età media 45.6 anni, range 20-72)
Tasso risposta:  Alto per entrambi i gruppi
Completezza:     >95% per domande chiuse a scala Likert
```

### Limitazioni Statistiche Attuali

**CRITICO - Mancanze Metodologiche**:
1. ❌ **Assenza test di significatività statistica** (t-test, ANOVA, chi-quadrato)
2. ❌ **Nessuna analisi inferenziale** (solo descrittive: media, mediana)
3. ❌ **Mancanza intervalli di confidenza** per le medie
4. ❌ **Nessuna analisi correlazione** tra variabili
5. ❌ **Assenza analisi fattoriale** per raggruppamenti costrutti
6. ❌ **Nessuna regressione** per identificare predittori
7. ❌ **Mancanza analisi dei valori mancanti** (missing data analysis)
8. ❌ **Nessuna verifica assunzioni** (normalità, omogeneità varianze)

**ALTO - Limitazioni Visualizzazione Scientifica**:
1. ⚠️ **Grafici privi di error bars** (deviazione standard, IC 95%)
2. ⚠️ **Distribuzioni incomplete** (mancano box plot, violin plot)
3. ⚠️ **Assenza heatmap correlazioni**
4. ⚠️ **Nessuna visualizzazione outliers**
5. ⚠️ **Grafici non esportabili** in formato pubblicazione (SVG, EPS)

**MEDIO - Mancanze Analitiche Avanzate**:
1. 📊 **Nessun clustering** (es. profili studenti/insegnanti)
2. 📊 **Assenza analisi longitudinale** (se prevista raccolta dati futura)
3. 📊 **Mancanza text mining** su risposte aperte
4. 📊 **Nessuna network analysis** (co-occorrenza strumenti AI)

---

## 🎯 Piano di Miglioramento - 4 Fasi

### FASE 1: Statistica Inferenziale Base (PRIORITÀ ALTA)
**Obiettivo**: Trasformare l'analisi da descrittiva a inferenziale
**Tempo**: 3-4 settimane
**Impatto Scientifico**: ⭐⭐⭐⭐⭐

#### 1.1 Test di Confronto Gruppi

**Studenti vs Insegnanti - Variabili Continue**

Implementare test statistici per:

```python
# Test da implementare:

1. T-TEST INDIPENDENTI (quando n>30 e varianze simili)
   - Competenza pratica: studenti (μ=4.32) vs insegnanti (μ=3.74)
   - Competenza teorica: studenti (μ=3.15) vs insegnanti (μ=3.28)
   - Fiducia integrazione: studenti (μ=4.47) vs insegnanti (μ=4.13)

   Outputs richiesti:
   - t-statistic
   - p-value
   - Cohen's d (effect size)
   - IC 95% per differenza medie

2. MANN-WHITNEY U TEST (se distribuzione non normale)
   - Backup per dati non parametrici
   - Z-statistic e p-value

3. LEVENE TEST (omogeneità varianze)
   - Pre-requisito per t-test
   - Se p<0.05 → usare Welch's t-test
```

**Esempio Output Atteso**:
```json
{
  "comparison": "Competenza Pratica",
  "students": {"mean": 4.32, "sd": 1.45, "n": 270},
  "teachers": {"mean": 3.74, "sd": 1.52, "n": 356},
  "test": "Independent t-test",
  "t_statistic": 4.87,
  "df": 624,
  "p_value": 0.00001,
  "effect_size": {"cohen_d": 0.39, "interpretation": "small-medium"},
  "ci_95": {"lower": 0.35, "upper": 0.81},
  "conclusion": "Studenti hanno competenza pratica significativamente superiore (p<0.001)"
}
```

#### 1.2 Test Chi-Quadrato per Variabili Categoriche

```python
# Test per:
1. Uso quotidiano AI (Sì/No) x Gruppo (Studenti/Insegnanti)
   - Studenti: 217/270 = 80.4%
   - Insegnanti: 203/356 = 57.0%
   - χ² test + Cramer's V

2. Genere x Uso AI
3. Livello scuola x Competenza (categorizzata)
4. Età (grouped) x Preoccupazioni AI

Output:
- χ² statistic
- p-value
- Cramer's V (effect size)
- Tabelle di contingenza con %
```

#### 1.3 ANOVA per Confronti Multipli

```python
# Quando ci sono >2 gruppi:

1. ANOVA One-Way: Competenza x Tipo Scuola (studenti)
   - Primaria vs Secondaria I° vs Secondaria II° vs Università

2. ANOVA One-Way: Competenza x Livello Insegnamento (insegnanti)
   - Infanzia vs Primaria vs Secondaria I° vs Secondaria II° vs Università

3. Post-hoc test: Tukey HSD
   - Confronti pairwise con correzione Bonferroni

Output:
- F-statistic
- p-value
- η² (eta squared - effect size)
- Post-hoc pairwise comparisons
```

**Codice Backend da Aggiungere**:

```python
# backend/app/statistics.py (NUOVO FILE)

from scipy import stats
import numpy as np
from typing import Dict, List, Tuple

class InferentialStats:
    """Analisi statistica inferenziale"""

    @staticmethod
    def independent_ttest(group1: List[float], group2: List[float],
                          labels: Tuple[str, str] = ("Group1", "Group2")) -> Dict:
        """
        T-test indipendente con effect size e IC

        Returns:
            dict con t, p-value, Cohen's d, CI 95%
        """
        # Verifica normalità
        _, p_norm1 = stats.shapiro(group1) if len(group1) < 5000 else (None, 1)
        _, p_norm2 = stats.shapiro(group2) if len(group2) < 5000 else (None, 1)

        # Levene test per omogeneità varianze
        _, p_levene = stats.levene(group1, group2)

        # T-test (Welch se varianze diverse)
        equal_var = p_levene > 0.05
        t_stat, p_value = stats.ttest_ind(group1, group2, equal_var=equal_var)

        # Cohen's d
        mean_diff = np.mean(group1) - np.mean(group2)
        pooled_std = np.sqrt((np.std(group1, ddof=1)**2 + np.std(group2, ddof=1)**2) / 2)
        cohens_d = mean_diff / pooled_std

        # Interpretazione effect size
        if abs(cohens_d) < 0.2:
            effect_interp = "negligible"
        elif abs(cohens_d) < 0.5:
            effect_interp = "small"
        elif abs(cohens_d) < 0.8:
            effect_interp = "medium"
        else:
            effect_interp = "large"

        # CI 95% per differenza medie
        se = np.sqrt(np.var(group1, ddof=1)/len(group1) + np.var(group2, ddof=1)/len(group2))
        ci_margin = 1.96 * se

        return {
            "test_type": "Welch's t-test" if not equal_var else "Student's t-test",
            "groups": {
                labels[0]: {
                    "n": len(group1),
                    "mean": round(np.mean(group1), 2),
                    "sd": round(np.std(group1, ddof=1), 2),
                    "median": round(np.median(group1), 2)
                },
                labels[1]: {
                    "n": len(group2),
                    "mean": round(np.mean(group2), 2),
                    "sd": round(np.std(group2, ddof=1), 2),
                    "median": round(np.median(group2), 2)
                }
            },
            "statistics": {
                "t_statistic": round(t_stat, 3),
                "df": len(group1) + len(group2) - 2,
                "p_value": round(p_value, 5),
                "mean_difference": round(mean_diff, 2),
                "ci_95": {
                    "lower": round(mean_diff - ci_margin, 2),
                    "upper": round(mean_diff + ci_margin, 2)
                }
            },
            "effect_size": {
                "cohens_d": round(cohens_d, 3),
                "interpretation": effect_interp
            },
            "assumptions": {
                "normality_group1": "pass" if p_norm1 > 0.05 else "fail",
                "normality_group2": "pass" if p_norm2 > 0.05 else "fail",
                "equal_variances": "pass" if equal_var else "fail"
            },
            "conclusion": {
                "significant": p_value < 0.05,
                "alpha": 0.05,
                "interpretation": f"{'Significant' if p_value < 0.05 else 'No significant'} difference (p={'<0.001' if p_value < 0.001 else f'={round(p_value, 3)}'}) with {effect_interp} effect size"
            }
        }

    @staticmethod
    def chi_square_test(contingency_table: np.ndarray,
                        row_labels: List[str],
                        col_labels: List[str]) -> Dict:
        """
        Test chi-quadrato per indipendenza

        Args:
            contingency_table: Tabella di contingenza (righe x colonne)
            row_labels: Etichette righe
            col_labels: Etichette colonne
        """
        chi2, p_value, dof, expected = stats.chi2_contingency(contingency_table)

        # Cramer's V (effect size)
        n = np.sum(contingency_table)
        min_dim = min(len(row_labels), len(col_labels)) - 1
        cramers_v = np.sqrt(chi2 / (n * min_dim))

        # Interpretazione Cramer's V
        if min_dim == 1:
            thresholds = [0.1, 0.3, 0.5]
        else:
            thresholds = [0.07, 0.21, 0.35]

        if cramers_v < thresholds[0]:
            effect_interp = "negligible"
        elif cramers_v < thresholds[1]:
            effect_interp = "small"
        elif cramers_v < thresholds[2]:
            effect_interp = "medium"
        else:
            effect_interp = "large"

        # Calcola percentuali
        row_totals = contingency_table.sum(axis=1)
        percentages = (contingency_table.T / row_totals * 100).T

        return {
            "test_type": "Chi-square test of independence",
            "contingency_table": {
                "observed": contingency_table.tolist(),
                "expected": expected.tolist(),
                "row_labels": row_labels,
                "col_labels": col_labels,
                "percentages": percentages.round(1).tolist()
            },
            "statistics": {
                "chi_square": round(chi2, 3),
                "df": dof,
                "p_value": round(p_value, 5),
                "n": int(n)
            },
            "effect_size": {
                "cramers_v": round(cramers_v, 3),
                "interpretation": effect_interp
            },
            "conclusion": {
                "significant": p_value < 0.05,
                "interpretation": f"Variables are {'dependent' if p_value < 0.05 else 'independent'} (p={'<0.001' if p_value < 0.001 else f'={round(p_value, 3)}'}) with {effect_interp} effect size"
            }
        }

    @staticmethod
    def one_way_anova(groups: Dict[str, List[float]]) -> Dict:
        """
        ANOVA one-way con post-hoc Tukey

        Args:
            groups: Dict con nome gruppo → lista valori
        """
        group_names = list(groups.keys())
        group_values = list(groups.values())

        # ANOVA
        f_stat, p_value = stats.f_oneway(*group_values)

        # Eta squared (effect size)
        # SS_between / SS_total
        all_values = np.concatenate(group_values)
        grand_mean = np.mean(all_values)

        ss_between = sum(len(g) * (np.mean(g) - grand_mean)**2 for g in group_values)
        ss_total = sum((x - grand_mean)**2 for x in all_values)
        eta_squared = ss_between / ss_total

        # Interpretazione
        if eta_squared < 0.01:
            effect_interp = "negligible"
        elif eta_squared < 0.06:
            effect_interp = "small"
        elif eta_squared < 0.14:
            effect_interp = "medium"
        else:
            effect_interp = "large"

        # Post-hoc Tukey (se p<0.05)
        posthoc = None
        if p_value < 0.05:
            from scipy.stats import tukey_hsd
            posthoc_result = tukey_hsd(*group_values)
            posthoc = {
                "pairwise_comparisons": [],
                "significant_pairs": []
            }

            for i in range(len(group_names)):
                for j in range(i+1, len(group_names)):
                    p_adj = posthoc_result.pvalue[i, j]
                    comparison = {
                        "group1": group_names[i],
                        "group2": group_names[j],
                        "mean_diff": round(np.mean(group_values[i]) - np.mean(group_values[j]), 2),
                        "p_adjusted": round(p_adj, 4),
                        "significant": p_adj < 0.05
                    }
                    posthoc["pairwise_comparisons"].append(comparison)
                    if p_adj < 0.05:
                        posthoc["significant_pairs"].append(f"{group_names[i]} vs {group_names[j]}")

        return {
            "test_type": "One-way ANOVA",
            "groups": {
                name: {
                    "n": len(values),
                    "mean": round(np.mean(values), 2),
                    "sd": round(np.std(values, ddof=1), 2)
                }
                for name, values in groups.items()
            },
            "statistics": {
                "f_statistic": round(f_stat, 3),
                "df_between": len(groups) - 1,
                "df_within": len(all_values) - len(groups),
                "p_value": round(p_value, 5)
            },
            "effect_size": {
                "eta_squared": round(eta_squared, 3),
                "interpretation": effect_interp
            },
            "posthoc": posthoc,
            "conclusion": {
                "significant": p_value < 0.05,
                "interpretation": f"Group means are {'different' if p_value < 0.05 else 'not significantly different'} (p={'<0.001' if p_value < 0.001 else f'={round(p_value, 3)}'}) with {effect_interp} effect size"
            }
        }
```

**Nuovi Endpoint API**:

```python
# backend/app/main.py - AGGIUNTE

from .statistics import InferentialStats

@app.get("/api/statistics/ttest/{variable}")
def compare_groups_ttest(variable: str, db: Session = Depends(get_db)):
    """
    Confronta studenti vs insegnanti con t-test

    Variabili disponibili:
    - practical_competence
    - theoretical_competence
    - trust_integration
    - training_adequacy
    - concern_ai (generic)
    """
    students = db.query(StudentResponse).all()
    teachers = db.query(TeacherResponse).filter(
        TeacherResponse.currently_teaching == 'Attualmente insegno.'
    ).all()

    # Estrai valori
    student_values = [getattr(s, variable) for s in students if getattr(s, variable) is not None]
    teacher_values = [getattr(t, variable) for t in teachers if getattr(t, variable) is not None]

    if not student_values or not teacher_values:
        raise HTTPException(status_code=404, detail="Insufficient data")

    result = InferentialStats.independent_ttest(
        student_values,
        teacher_values,
        labels=("Students", "Teachers")
    )

    result["variable"] = variable
    return result


@app.get("/api/statistics/chi-square/usage")
def chi_square_usage(db: Session = Depends(get_db)):
    """
    Test chi-quadrato: Uso quotidiano AI x Gruppo
    """
    students = db.query(StudentResponse).all()
    teachers = db.query(TeacherResponse).filter(
        TeacherResponse.currently_teaching == 'Attualmente insegno.'
    ).all()

    # Tabella di contingenza: righe = gruppo, colonne = uso (Sì/No)
    student_yes = sum(1 for s in students if s.uses_ai_daily == 'Sì')
    student_no = len(students) - student_yes

    teacher_yes = sum(1 for t in teachers if t.uses_ai_daily == 'Sì')
    teacher_no = len(teachers) - teacher_yes

    contingency = np.array([
        [student_yes, student_no],
        [teacher_yes, teacher_no]
    ])

    result = InferentialStats.chi_square_test(
        contingency,
        row_labels=["Students", "Teachers"],
        col_labels=["Uses AI Daily (Yes)", "Uses AI Daily (No)"]
    )

    return result


@app.get("/api/statistics/anova/competence-by-school")
def anova_competence_school(
    competence_type: str = "practical_competence",
    db: Session = Depends(get_db)
):
    """
    ANOVA: Competenza x Tipo di Scuola (studenti)
    """
    students = db.query(StudentResponse).all()

    # Raggruppa per tipo scuola
    groups = {}
    for s in students:
        if s.school_type and getattr(s, competence_type):
            if s.school_type not in groups:
                groups[s.school_type] = []
            groups[s.school_type].append(getattr(s, competence_type))

    # Filtra gruppi con almeno 10 osservazioni
    groups = {k: v for k, v in groups.items() if len(v) >= 10}

    if len(groups) < 2:
        raise HTTPException(status_code=404, detail="Not enough groups for ANOVA")

    result = InferentialStats.one_way_anova(groups)
    result["variable"] = competence_type
    result["grouping_variable"] = "school_type"

    return result
```

---

### FASE 2: Analisi Correlazioni e Regressioni (PRIORITÀ ALTA)
**Obiettivo**: Identificare relazioni tra variabili e predittori
**Tempo**: 2-3 settimane
**Impatto Scientifico**: ⭐⭐⭐⭐⭐

#### 2.1 Matrice di Correlazione

**Variabili da Correlare** (Studenti):
```
1. Competenza pratica
2. Competenza teorica
3. Ore utilizzo quotidiano
4. Ore utilizzo studio
5. Fiducia integrazione AI
6. Percezione cambio studio
7. Adeguatezza formazione
8. Preoccupazione AI scuola
9. Preoccupazione AI compagni
10. Età
```

**Analisi**:
```python
# Pearson (dati continui, relazioni lineari)
# Spearman (dati ordinali, relazioni monotone)

Domande di ricerca:
- La competenza pratica correla con ore d'uso? (atteso: r > 0.4)
- La fiducia correla negativamente con preoccupazioni? (atteso: r < -0.3)
- L'età predice la competenza? (da verificare)
- Competenza pratica e teorica sono correlate? (atteso: r > 0.5)
```

**Output Visivo Richiesto**:
- Heatmap correlazioni con colori (rosso=negativa, blu=positiva)
- Significatività indicata con asterischi (*, **, ***)
- Scatter plots per correlazioni forti (r > 0.4)

**Codice**:
```python
# backend/app/statistics.py - AGGIUNTE

import pandas as pd
from scipy.stats import pearsonr, spearmanr

class CorrelationAnalysis:

    @staticmethod
    def correlation_matrix(data: pd.DataFrame, method: str = "pearson") -> Dict:
        """
        Matrice di correlazione con test di significatività

        Args:
            data: DataFrame con variabili continue
            method: 'pearson' o 'spearman'
        """
        variables = data.columns.tolist()
        n = len(variables)

        corr_matrix = np.zeros((n, n))
        p_matrix = np.zeros((n, n))

        for i, var1 in enumerate(variables):
            for j, var2 in enumerate(variables):
                if i == j:
                    corr_matrix[i, j] = 1.0
                    p_matrix[i, j] = 0.0
                elif i < j:
                    # Rimuovi NaN
                    valid = ~(data[var1].isna() | data[var2].isna())
                    x = data[var1][valid]
                    y = data[var2][valid]

                    if len(x) > 3:
                        if method == "pearson":
                            r, p = pearsonr(x, y)
                        else:
                            r, p = spearmanr(x, y)

                        corr_matrix[i, j] = r
                        corr_matrix[j, i] = r
                        p_matrix[i, j] = p
                        p_matrix[j, i] = p

        # Trova correlazioni significative
        significant_pairs = []
        for i in range(n):
            for j in range(i+1, n):
                if p_matrix[i, j] < 0.05:
                    significant_pairs.append({
                        "var1": variables[i],
                        "var2": variables[j],
                        "correlation": round(corr_matrix[i, j], 3),
                        "p_value": round(p_matrix[i, j], 5),
                        "strength": (
                            "very strong" if abs(corr_matrix[i, j]) >= 0.7 else
                            "strong" if abs(corr_matrix[i, j]) >= 0.5 else
                            "moderate" if abs(corr_matrix[i, j]) >= 0.3 else
                            "weak"
                        ),
                        "direction": "positive" if corr_matrix[i, j] > 0 else "negative"
                    })

        # Ordina per forza correlazione
        significant_pairs.sort(key=lambda x: abs(x["correlation"]), reverse=True)

        return {
            "method": method,
            "variables": variables,
            "correlation_matrix": corr_matrix.round(3).tolist(),
            "p_value_matrix": p_matrix.round(5).tolist(),
            "significant_correlations": significant_pairs,
            "interpretation": {
                "total_comparisons": n * (n - 1) // 2,
                "significant_count": len(significant_pairs),
                "strongest_correlation": significant_pairs[0] if significant_pairs else None
            }
        }
```

#### 2.2 Regressione Lineare Multipla

**Modelli da Testare**:

**Modello 1: Predittori della Competenza Pratica (Studenti)**
```
DV: Competenza pratica (1-7)
IVs:
- Ore utilizzo quotidiano (continua)
- Ore utilizzo studio (continua)
- Età (continua)
- Usa AI quotidianamente (dummy: 0/1)
- Tipo scuola (dummy coded: università vs altro)

Output atteso:
- R² (varianza spiegata)
- β coefficienti standardizzati
- p-values per ogni predittore
- VIF (multicollinearità)
```

**Modello 2: Predittori della Fiducia in AI (Insegnanti)**
```
DV: Fiducia integrazione AI (1-7)
IVs:
- Competenza pratica
- Competenza teorica
- Ore utilizzo didattica
- Adeguatezza formazione
- Preoccupazione AI educazione (inversa)

Domanda: Cosa predice la fiducia degli insegnanti?
```

**Codice**:
```python
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error
from statsmodels.stats.outliers_influence import variance_inflation_factor

class RegressionAnalysis:

    @staticmethod
    def multiple_regression(X: pd.DataFrame, y: pd.Series,
                           feature_names: List[str]) -> Dict:
        """
        Regressione lineare multipla con diagnostica

        Args:
            X: DataFrame predictori (già preprocessato)
            y: Serie target
            feature_names: Nomi features
        """
        # Rimuovi NaN
        valid = ~(y.isna() | X.isna().any(axis=1))
        X_clean = X[valid]
        y_clean = y[valid]

        # Fit modello
        model = LinearRegression()
        model.fit(X_clean, y_clean)

        # Predizioni
        y_pred = model.predict(X_clean)

        # R²
        r2 = r2_score(y_clean, y_pred)
        adj_r2 = 1 - (1 - r2) * (len(y_clean) - 1) / (len(y_clean) - X_clean.shape[1] - 1)

        # RMSE
        rmse = np.sqrt(mean_squared_error(y_clean, y_pred))

        # Coefficienti
        coefficients = []
        for i, name in enumerate(feature_names):
            # Calcola beta standardizzato
            std_x = X_clean.iloc[:, i].std()
            std_y = y_clean.std()
            beta_std = model.coef_[i] * (std_x / std_y)

            coefficients.append({
                "feature": name,
                "coefficient": round(model.coef_[i], 4),
                "std_coefficient": round(beta_std, 4),
                "interpretation": f"1 unit increase in {name} → {round(model.coef_[i], 2)} unit change in outcome"
            })

        # VIF (multicollinearità)
        vif_data = []
        for i in range(X_clean.shape[1]):
            vif = variance_inflation_factor(X_clean.values, i)
            vif_data.append({
                "feature": feature_names[i],
                "vif": round(vif, 2),
                "multicollinearity": "High (>10)" if vif > 10 else "Moderate (5-10)" if vif > 5 else "Low (<5)"
            })

        # Residuals analysis
        residuals = y_clean - y_pred

        return {
            "model_summary": {
                "n_observations": len(y_clean),
                "n_features": X_clean.shape[1],
                "r_squared": round(r2, 4),
                "adjusted_r_squared": round(adj_r2, 4),
                "rmse": round(rmse, 3),
                "intercept": round(model.intercept_, 4)
            },
            "coefficients": coefficients,
            "vif": vif_data,
            "residuals": {
                "mean": round(residuals.mean(), 4),
                "std": round(residuals.std(), 4),
                "min": round(residuals.min(), 3),
                "max": round(residuals.max(), 3)
            },
            "interpretation": {
                "variance_explained": f"{round(r2*100, 1)}% of variance in outcome is explained by predictors",
                "model_fit": "Excellent" if r2 > 0.7 else "Good" if r2 > 0.5 else "Moderate" if r2 > 0.3 else "Weak",
                "top_predictors": sorted(coefficients, key=lambda x: abs(x["std_coefficient"]), reverse=True)[:3]
            }
        }
```

**Endpoint API**:
```python
@app.get("/api/statistics/regression/practical-competence")
def regression_practical_competence(db: Session = Depends(get_db)):
    """
    Regressione: Predittori competenza pratica studenti
    """
    students = db.query(StudentResponse).all()

    # Prepara dati
    data = []
    for s in students:
        if all([s.practical_competence, s.hours_daily, s.hours_study, s.age]):
            data.append({
                "practical_competence": s.practical_competence,
                "hours_daily": s.hours_daily,
                "hours_study": s.hours_study,
                "age": s.age,
                "uses_ai_daily": 1 if s.uses_ai_daily == 'Sì' else 0,
                "is_university": 1 if "Università" in (s.school_type or "") else 0
            })

    df = pd.DataFrame(data)

    X = df[["hours_daily", "hours_study", "age", "uses_ai_daily", "is_university"]]
    y = df["practical_competence"]

    result = RegressionAnalysis.multiple_regression(
        X, y,
        feature_names=["Hours Daily", "Hours Study", "Age", "Uses AI Daily", "University Student"]
    )

    result["dependent_variable"] = "Practical Competence (1-7)"
    return result
```

---

### FASE 3: Visualizzazioni Scientifiche Avanzate (PRIORITÀ ALTA)
**Obiettivo**: Grafici publication-ready con standard scientifici
**Tempo**: 2-3 settimane
**Impatto UX**: ⭐⭐⭐⭐⭐

#### 3.1 Error Bars e Intervalli di Confidenza

**Problema Attuale**: I grafici mostrano solo medie, senza indicazione variabilità

**Soluzione**:
```javascript
// frontend - MODIFICA Chart Components

// Esempio: Bar Chart con Error Bars
const CompetenceChart = ({ data }) => {
  // data = [
  //   { competenza: 'Pratica',
  //     Studenti_mean: 4.32, Studenti_sd: 1.45, Studenti_ci_lower: 4.14, Studenti_ci_upper: 4.50,
  //     Insegnanti_mean: 3.74, Insegnanti_sd: 1.52, ...
  //   }
  // ]

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="competenza" />
        <YAxis domain={[0, 7]} label={{ value: 'Score (1-7)', angle: -90, position: 'insideLeft' }} />
        <Tooltip
          content={<CustomTooltipWithStats />}  {/* Mostra media ± SD */}
        />
        <Legend />

        {/* Barre con valori medi */}
        <Bar dataKey="Studenti_mean" name="Students" fill="#3b82f6">
          {/* Error bars (CI 95%) */}
          <ErrorBar
            dataKey="Studenti_ci_lower"
            direction="down"
            width={4}
            strokeWidth={2}
            stroke="#1e40af"
          />
          <ErrorBar
            dataKey="Studenti_ci_upper"
            direction="up"
            width={4}
            strokeWidth={2}
            stroke="#1e40af"
          />
        </Bar>

        <Bar dataKey="Insegnanti_mean" name="Teachers" fill="#10b981">
          <ErrorBar dataKey="Insegnanti_ci_lower" direction="down" width={4} strokeWidth={2} stroke="#047857" />
          <ErrorBar dataKey="Insegnanti_ci_upper" direction="up" width={4} strokeWidth={2} stroke="#047857" />
        </Bar>

        {/* Linea di riferimento */}
        <ReferenceLine y={4} stroke="#94a3b8" strokeDasharray="3 3" label="Midpoint" />
      </BarChart>
    </ResponsiveContainer>
  )
}

const CustomTooltipWithStats = ({ active, payload }) => {
  if (!active || !payload) return null

  return (
    <div style={{ background: 'white', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
      <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>{payload[0].payload.competenza}</p>
      {payload.map((entry, idx) => (
        <div key={idx} style={{ marginBottom: '4px', color: entry.color }}>
          <span style={{ fontWeight: '600' }}>{entry.name}</span>
          <br/>
          <span>Mean: {entry.value.toFixed(2)}</span>
          <br/>
          <span>SD: ±{entry.payload[`${entry.name}_sd`]?.toFixed(2)}</span>
          <br/>
          <span style={{ fontSize: '0.85em', color: '#64748b' }}>
            95% CI: [{entry.payload[`${entry.name}_ci_lower`]?.toFixed(2)}, {entry.payload[`${entry.name}_ci_upper`]?.toFixed(2)}]
          </span>
        </div>
      ))}
    </div>
  )
}
```

**Backend - Aggiungere CI a tutte le risposte**:
```python
# backend/app/analytics.py - MODIFICA

import scipy.stats as stats

def calculate_mean_with_ci(values: List[float], confidence: float = 0.95) -> Dict:
    """
    Calcola media con intervallo di confidenza
    """
    if not values:
        return {"mean": 0, "sd": 0, "ci_lower": 0, "ci_upper": 0, "n": 0}

    n = len(values)
    mean = np.mean(values)
    sd = np.std(values, ddof=1)
    se = sd / np.sqrt(n)

    # t-distribution per IC
    t_crit = stats.t.ppf((1 + confidence) / 2, n - 1)
    margin = t_crit * se

    return {
        "mean": round(mean, 2),
        "sd": round(sd, 2),
        "se": round(se, 3),
        "ci_lower": round(mean - margin, 2),
        "ci_upper": round(mean + margin, 2),
        "n": n,
        "confidence_level": confidence
    }

# Usare in tutte le analisi:
practical_comp_stats = calculate_mean_with_ci(practical_comp)
# Output: {'mean': 4.32, 'sd': 1.45, 'ci_lower': 4.14, 'ci_upper': 4.50, 'n': 270}
```

#### 3.2 Box Plot e Violin Plot per Distribuzioni

**Obiettivo**: Visualizzare distribuzioni complete, non solo medie

```javascript
// Nuovo componente: DistributionChart.jsx

import { ResponsiveContainer } from 'recharts'
import { VictoryBoxPlot, VictoryChart, VictoryTheme, VictoryAxis, VictoryLabel } from 'victory'

const DistributionBoxPlot = ({ data }) => {
  // data = [
  //   { x: "Students\nPractical", min: 1, q1: 3, median: 4, q3: 5, max: 7, outliers: [7, 7] },
  //   { x: "Teachers\nPractical", min: 1, q1: 3, median: 4, q3: 5, max: 7 }
  // ]

  return (
    <div style={{ width: '100%', height: 400 }}>
      <VictoryChart
        theme={VictoryTheme.material}
        domainPadding={30}
      >
        <VictoryAxis
          label="Group"
          style={{
            axisLabel: { padding: 30, fontSize: 14 },
            tickLabels: { fontSize: 11 }
          }}
        />
        <VictoryAxis
          dependentAxis
          label="Competence Score (1-7)"
          style={{
            axisLabel: { padding: 40, fontSize: 14 },
            tickLabels: { fontSize: 11 }
          }}
        />
        <VictoryBoxPlot
          data={data}
          boxWidth={20}
          style={{
            min: { stroke: "#3b82f6", strokeWidth: 2 },
            max: { stroke: "#3b82f6", strokeWidth: 2 },
            q1: { fill: "#93c5fd" },
            q3: { fill: "#93c5fd" },
            median: { stroke: "#1e40af", strokeWidth: 3 }
          }}
        />
      </VictoryChart>
    </div>
  )
}

// Backend endpoint per box plot data
@app.get("/api/visualizations/boxplot/{variable}")
def boxplot_data(variable: str, db: Session = Depends(get_db)):
    """
    Dati per box plot: quartili, outliers
    """
    students = db.query(StudentResponse).all()
    teachers = db.query(TeacherResponse).filter(...).all()

    student_values = [getattr(s, variable) for s in students if getattr(s, variable)]
    teacher_values = [getattr(t, variable) for t in teachers if getattr(t, variable)]

    def calc_boxplot_stats(values):
        q1 = np.percentile(values, 25)
        median = np.percentile(values, 50)
        q3 = np.percentile(values, 75)
        iqr = q3 - q1

        # Outliers (oltre 1.5*IQR dai quartili)
        lower_fence = q1 - 1.5 * iqr
        upper_fence = q3 + 1.5 * iqr
        outliers = [v for v in values if v < lower_fence or v > upper_fence]

        # Min/max escludendo outliers
        non_outliers = [v for v in values if lower_fence <= v <= upper_fence]

        return {
            "min": round(min(non_outliers), 2) if non_outliers else round(min(values), 2),
            "q1": round(q1, 2),
            "median": round(median, 2),
            "q3": round(q3, 2),
            "max": round(max(non_outliers), 2) if non_outliers else round(max(values), 2),
            "outliers": [round(o, 2) for o in outliers],
            "n": len(values)
        }

    return {
        "variable": variable,
        "students": {
            "x": "Students",
            **calc_boxplot_stats(student_values)
        },
        "teachers": {
            "x": "Teachers",
            **calc_boxplot_stats(teacher_values)
        }
    }
```

#### 3.3 Heatmap per Correlazioni

```javascript
// Componente: CorrelationHeatmap.jsx

import Plot from 'react-plotly.js'

const CorrelationHeatmap = ({ correlationData }) => {
  // correlationData = {
  //   variables: ["Practical", "Theoretical", "Trust", "Concern"],
  //   correlation_matrix: [[1, 0.52, 0.41, -0.22], ...],
  //   p_value_matrix: [[0, 0.001, 0.003, 0.04], ...]
  // }

  const { variables, correlation_matrix, p_value_matrix } = correlationData

  // Crea annotazioni con asterischi per significatività
  const annotations = []
  for (let i = 0; i < variables.length; i++) {
    for (let j = 0; j < variables.length; j++) {
      const r = correlation_matrix[i][j]
      const p = p_value_matrix[i][j]

      let text = r.toFixed(2)
      if (p < 0.001) text += "***"
      else if (p < 0.01) text += "**"
      else if (p < 0.05) text += "*"

      annotations.push({
        x: j,
        y: i,
        text: text,
        showarrow: false,
        font: {
          color: Math.abs(r) > 0.5 ? 'white' : 'black',
          size: 11
        }
      })
    }
  }

  return (
    <Plot
      data={[{
        z: correlation_matrix,
        x: variables,
        y: variables,
        type: 'heatmap',
        colorscale: [
          [0, '#b91c1c'],      // Rosso scuro (r = -1)
          [0.5, '#f3f4f6'],    // Grigio chiaro (r = 0)
          [1, '#1e40af']       // Blu scuro (r = 1)
        ],
        zmid: 0,
        zmin: -1,
        zmax: 1,
        colorbar: {
          title: 'Correlation',
          titleside: 'right',
          tickvals: [-1, -0.5, 0, 0.5, 1]
        }
      }]}
      layout={{
        title: 'Correlation Matrix<br><sub>*p<0.05, **p<0.01, ***p<0.001</sub>',
        annotations: annotations,
        xaxis: {
          side: 'bottom',
          tickangle: -45
        },
        yaxis: {
          autorange: 'reversed'
        },
        width: 700,
        height: 700,
        margin: { l: 100, r: 100, t: 100, b: 150 }
      }}
      config={{
        displayModeBar: true,
        toImageButtonOptions: {
          format: 'svg',  // Esportazione SVG per pubblicazioni
          filename: 'correlation_heatmap',
          height: 700,
          width: 700,
          scale: 1
        }
      }}
    />
  )
}
```

#### 3.4 Scatter Plot con Regression Line

```javascript
// Scatter plot per correlazioni significative

const ScatterWithRegression = ({ data, xLabel, yLabel, regression }) => {
  // data = [{ x: 4.5, y: 5.2 }, { x: 3.2, y: 4.1 }, ...]
  // regression = { slope: 0.45, intercept: 1.2, r: 0.52, p: 0.001, r_squared: 0.27 }

  // Calcola linea di regressione
  const xMin = Math.min(...data.map(d => d.x))
  const xMax = Math.max(...data.map(d => d.x))
  const regressionLine = [
    { x: xMin, y: regression.slope * xMin + regression.intercept },
    { x: xMax, y: regression.slope * xMax + regression.intercept }
  ]

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="x"
          name={xLabel}
          label={{ value: xLabel, position: 'insideBottom', offset: -10 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yLabel}
          label={{ value: yLabel, angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={({ payload }) => {
            if (!payload || !payload[0]) return null
            return (
              <div style={{ background: 'white', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <p>{xLabel}: {payload[0].value.toFixed(2)}</p>
                <p>{yLabel}: {payload[0].payload.y.toFixed(2)}</p>
              </div>
            )
          }}
        />

        {/* Scatter points */}
        <Scatter name="Data" data={data} fill="#3b82f6" fillOpacity={0.6} />

        {/* Regression line */}
        <Scatter
          name={`Linear fit: r=${regression.r.toFixed(2)}, p=${regression.p < 0.001 ? '<0.001' : regression.p.toFixed(3)}`}
          data={regressionLine}
          fill="#ef4444"
          line
          lineType="fitting"
          shape="none"
          legendType="line"
        />
      </ScatterChart>

      {/* Regression equation */}
      <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.9em', color: '#64748b' }}>
        <p>y = {regression.slope.toFixed(3)}x + {regression.intercept.toFixed(2)}</p>
        <p>R² = {regression.r_squared.toFixed(3)} (p {regression.p < 0.001 ? '<0.001' : `= ${regression.p.toFixed(3)}`})</p>
      </div>
    </ResponsiveContainer>
  )
}
```

---

### FASE 4: Analisi Avanzate e Text Mining (PRIORITÀ MEDIA)
**Obiettivo**: Estrarre insights da dati testuali e pattern nascosti
**Tempo**: 3-4 settimane
**Impatto Scientifico**: ⭐⭐⭐⭐

#### 4.1 Clustering (K-Means) per Profili Utenti

**Obiettivo**: Identificare gruppi omogenei di studenti/insegnanti

```python
# backend/app/advanced_analytics.py (NUOVO FILE)

from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import pandas as pd

class ClusteringAnalysis:

    @staticmethod
    def kmeans_clustering(data: pd.DataFrame, n_clusters: int = 3,
                         feature_cols: List[str] = None) -> Dict:
        """
        K-Means clustering su dataset

        Args:
            data: DataFrame con features
            n_clusters: Numero cluster
            feature_cols: Colonne da usare (None = tutte numeriche)
        """
        if feature_cols is None:
            feature_cols = data.select_dtypes(include=[np.number]).columns.tolist()

        X = data[feature_cols].dropna()

        # Standardizza
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # K-Means
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(X_scaled)

        # PCA per visualizzazione 2D
        pca = PCA(n_components=2)
        X_pca = pca.fit_transform(X_scaled)

        # Caratteristiche cluster
        cluster_profiles = []
        for i in range(n_clusters):
            cluster_mask = clusters == i
            cluster_data = data[cluster_mask]

            profile = {
                "cluster_id": i,
                "size": int(cluster_mask.sum()),
                "percentage": round(cluster_mask.sum() / len(data) * 100, 1),
                "centroid": {}
            }

            # Media features per cluster
            for col in feature_cols:
                profile["centroid"][col] = round(cluster_data[col].mean(), 2)

            cluster_profiles.append(profile)

        # Interpretazione cluster (esempio: studenti)
        interpretations = []
        for profile in cluster_profiles:
            if profile["centroid"].get("practical_competence", 0) > 5:
                label = "High Competence Users"
            elif profile["centroid"].get("hours_daily", 0) < 2:
                label = "Low Usage Users"
            else:
                label = "Moderate Users"

            interpretations.append({
                "cluster": profile["cluster_id"],
                "label": label,
                "description": f"N={profile['size']} ({profile['percentage']}%)"
            })

        return {
            "n_clusters": n_clusters,
            "features_used": feature_cols,
            "cluster_profiles": cluster_profiles,
            "interpretations": interpretations,
            "pca_visualization": {
                "x": X_pca[:, 0].tolist(),
                "y": X_pca[:, 1].tolist(),
                "cluster_labels": clusters.tolist(),
                "explained_variance": [round(v, 3) for v in pca.explained_variance_ratio_]
            },
            "inertia": round(kmeans.inertia_, 2)  # Within-cluster sum of squares
        }


@app.get("/api/advanced/clustering/students")
def cluster_students(n_clusters: int = 3, db: Session = Depends(get_db)):
    """
    Clustering studenti basato su competenze, uso, fiducia
    """
    students = db.query(StudentResponse).all()

    data = []
    for s in students:
        if all([s.practical_competence, s.theoretical_competence, s.trust_integration,
                s.hours_daily, s.concern_ai_school]):
            data.append({
                "practical_competence": s.practical_competence,
                "theoretical_competence": s.theoretical_competence,
                "trust_integration": s.trust_integration,
                "hours_daily": s.hours_daily,
                "concern_ai_school": s.concern_ai_school,
                "training_adequacy": s.training_adequacy or 0
            })

    df = pd.DataFrame(data)

    result = ClusteringAnalysis.kmeans_clustering(
        df,
        n_clusters=n_clusters,
        feature_cols=list(df.columns)
    )

    return result
```

**Visualizzazione Frontend (PCA Scatter)**:
```javascript
const ClusterVisualization = ({ clusterData }) => {
  const { pca_visualization, cluster_profiles } = clusterData

  // Raggruppa punti per cluster
  const clustersData = cluster_profiles.map((profile, idx) => {
    const clusterPoints = pca_visualization.cluster_labels
      .map((label, i) => label === idx ? { x: pca_visualization.x[i], y: pca_visualization.y[i] } : null)
      .filter(p => p !== null)

    return {
      name: `Cluster ${idx}: ${profile.size} users (${profile.percentage}%)`,
      data: clusterPoints,
      fill: COLORS[idx]
    }
  })

  return (
    <ResponsiveContainer width="100%" height={500}>
      <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="x"
          name="PC1"
          label={{ value: `PC1 (${(pca_visualization.explained_variance[0]*100).toFixed(1)}%)`, position: 'insideBottom', offset: -10 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="PC2"
          label={{ value: `PC2 (${(pca_visualization.explained_variance[1]*100).toFixed(1)}%)`, angle: -90, position: 'insideLeft' }}
        />
        <Tooltip />
        <Legend />

        {clustersData.map((cluster, idx) => (
          <Scatter
            key={idx}
            name={cluster.name}
            data={cluster.data}
            fill={cluster.fill}
            fillOpacity={0.6}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  )
}
```

#### 4.2 Text Mining su Risposte Aperte

**Obiettivo**: Analizzare risposte testuali per temi ricorrenti

```python
# Richiede: pip install nltk spacy wordcloud

from collections import Counter
import re
from typing import List, Dict
import spacy

class TextAnalysis:

    def __init__(self):
        # Carica modello italiano
        try:
            self.nlp = spacy.load("it_core_news_sm")
        except:
            # Fallback a processing base
            self.nlp = None

    def extract_keywords(self, texts: List[str], top_n: int = 20) -> List[Dict]:
        """
        Estrae keywords più frequenti da testi

        Args:
            texts: Lista di testi aperti
            top_n: Top N keywords da ritornare
        """
        # Stopwords italiane
        stopwords = set([
            'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una',
            'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
            'che', 'è', 'e', 'o', 'ma', 'se', 'non', 'più', 'molto',
            'anche', 'come', 'quando', 'dove', 'perché', 'sono', 'ho',
            'ha', 'hanno', 'essere', 'avere', 'fare', 'questo', 'quello'
        ])

        all_words = []

        for text in texts:
            if not text or pd.isna(text):
                continue

            # Lowercase e rimuovi punteggiatura
            text_clean = re.sub(r'[^\w\s]', '', text.lower())

            if self.nlp:
                # Usa spaCy per lemmatizzazione e POS tagging
                doc = self.nlp(text_clean)
                words = [token.lemma_ for token in doc
                        if not token.is_stop and token.is_alpha and len(token.text) > 3
                        and token.pos_ in ['NOUN', 'VERB', 'ADJ']]
            else:
                # Fallback: split semplice
                words = [w for w in text_clean.split()
                        if w not in stopwords and len(w) > 3]

            all_words.extend(words)

        # Conta frequenze
        word_counts = Counter(all_words)

        return [
            {"word": word, "count": count, "percentage": round(count/len(all_words)*100, 2)}
            for word, count in word_counts.most_common(top_n)
        ]

    def sentiment_analysis_simple(self, texts: List[str]) -> Dict:
        """
        Analisi sentiment base (italiano)

        Returns:
            Distribuzione positivo/negativo/neutro
        """
        positive_words = set([
            'utile', 'buon', 'buona', 'ottimo', 'eccellente', 'efficace',
            'migliore', 'aiuto', 'aiuta', 'facilita', 'veloce', 'rapido',
            'interessante', 'innovativo', 'positivo', 'fiducioso', 'sicuro'
        ])

        negative_words = set([
            'difficile', 'problematico', 'pericoloso', 'rischio', 'preoccupante',
            'negativo', 'cattivo', 'pessimo', 'inefficace', 'lento', 'complicato',
            'confuso', 'paura', 'timore', 'critico', 'limitato'
        ])

        sentiments = []

        for text in texts:
            if not text or pd.isna(text):
                continue

            text_lower = text.lower()
            words = set(re.findall(r'\w+', text_lower))

            pos_count = len(words & positive_words)
            neg_count = len(words & negative_words)

            if pos_count > neg_count:
                sentiments.append('positive')
            elif neg_count > pos_count:
                sentiments.append('negative')
            else:
                sentiments.append('neutral')

        sentiment_counts = Counter(sentiments)
        total = len(sentiments)

        return {
            "total_responses": total,
            "distribution": {
                "positive": {
                    "count": sentiment_counts.get('positive', 0),
                    "percentage": round(sentiment_counts.get('positive', 0)/total*100, 1) if total > 0 else 0
                },
                "negative": {
                    "count": sentiment_counts.get('negative', 0),
                    "percentage": round(sentiment_counts.get('negative', 0)/total*100, 1) if total > 0 else 0
                },
                "neutral": {
                    "count": sentiment_counts.get('neutral', 0),
                    "percentage": round(sentiment_counts.get('neutral', 0)/total*100, 1) if total > 0 else 0
                }
            }
        }


@app.get("/api/advanced/text-analysis/open-responses")
def analyze_open_responses(
    respondent_type: str = "student",
    question_field: str = "ai_concerns",  # Campo open_responses
    db: Session = Depends(get_db)
):
    """
    Analisi testuale risposte aperte
    """
    if respondent_type == "student":
        responses = db.query(StudentResponse).all()
    else:
        responses = db.query(TeacherResponse).all()

    # Estrai testi
    texts = []
    for r in responses:
        if r.open_responses and question_field in r.open_responses:
            texts.append(r.open_responses[question_field])

    if not texts:
        raise HTTPException(status_code=404, detail="No open responses found")

    analyzer = TextAnalysis()

    keywords = analyzer.extract_keywords(texts, top_n=30)
    sentiment = analyzer.sentiment_analysis_simple(texts)

    return {
        "respondent_type": respondent_type,
        "question_field": question_field,
        "total_responses": len(texts),
        "keywords": keywords,
        "sentiment": sentiment
    }
```

**Visualizzazione: Word Cloud**

```javascript
// Componente WordCloud

import ReactWordcloud from 'react-wordcloud'

const KeywordWordCloud = ({ keywords }) => {
  // keywords = [{ word: "apprendimento", count: 45 }, ...]

  const words = keywords.map(k => ({ text: k.word, value: k.count }))

  const options = {
    rotations: 2,
    rotationAngles: [0, 90],
    fontSizes: [12, 60],
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    enableTooltip: true,
    deterministic: true,
    fontFamily: 'Inter, sans-serif',
    fontWeight: 'bold',
    padding: 2
  }

  const callbacks = {
    onWordClick: (word) => {
      console.log(`"${word.text}" clicked (count: ${word.value})`)
    },
    getWordTooltip: (word) => `"${word.text}" appears ${word.value} times`
  }

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ReactWordcloud
        words={words}
        options={options}
        callbacks={callbacks}
      />
    </div>
  )
}
```

---

## 📈 Miglioramenti UX - Prospettiva User Experience

### UX Issue 1: Information Overload (Dashboard)

**Problema**: La dashboard mostra troppi dati contemporaneamente, causando cognitive overload

**Soluzione**: Progressive Disclosure + Dashboard Modulare

```javascript
// Implementare sistema di "Insights Cards" prioritizzati

const DashboardInsights = ({ stats }) => {
  const [expandedInsights, setExpandedInsights] = useState(new Set())

  // Calcola insights automaticamente (AI-driven)
  const insights = [
    {
      id: 'competence_gap',
      priority: 'high',
      title: 'Competence Gap Identified',
      icon: '⚠️',
      summary: 'Students report 15% higher practical competence than teachers',
      detail: {
        chart: <CompetenceComparisonChart />,
        stats: 'Students: μ=4.32 (SD=1.45), Teachers: μ=3.74 (SD=1.52), t(624)=4.87, p<0.001',
        recommendation: 'Consider targeted training programs for teachers'
      },
      actionable: true
    },
    {
      id: 'usage_adoption',
      priority: 'medium',
      title: 'High Student Adoption',
      icon: '📈',
      summary: '80% of students use AI daily vs 57% of teachers',
      detail: {
        chart: <UsageComparisonChart />,
        stats: 'χ²(1)=42.3, p<0.001, Cramer\'s V=0.26 (medium effect)'
      }
    }
    // ... altri insights automatici
  ]

  // Ordina per priorità
  const sortedInsights = insights.sort((a, b) => {
    const priority_order = { high: 3, medium: 2, low: 1 }
    return priority_order[b.priority] - priority_order[a.priority]
  })

  return (
    <div className="insights-container">
      <h2>📊 Key Insights</h2>
      <div className="insights-grid">
        {sortedInsights.map(insight => (
          <div
            key={insight.id}
            className={`insight-card priority-${insight.priority}`}
            onClick={() => toggleExpanded(insight.id)}
          >
            <div className="insight-header">
              <span className="insight-icon">{insight.icon}</span>
              <h3>{insight.title}</h3>
              {insight.priority === 'high' && <span className="badge-high">High Priority</span>}
            </div>

            <p className="insight-summary">{insight.summary}</p>

            {expandedInsights.has(insight.id) && (
              <div className="insight-detail">
                <div className="chart-container">
                  {insight.detail.chart}
                </div>
                <p className="stats-detail">{insight.detail.stats}</p>
                {insight.detail.recommendation && (
                  <div className="recommendation">
                    <strong>💡 Recommendation:</strong> {insight.detail.recommendation}
                  </div>
                )}
              </div>
            )}

            <button className="expand-btn">
              {expandedInsights.has(insight.id) ? 'Show Less ▲' : 'Show More ▼'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### UX Issue 2: Mancanza di Contesto per Numeri

**Problema**: Le statistiche sono mostrate senza riferimenti o benchmark

**Soluzione**: Indicatori di Contesto + Benchmarking

```javascript
// Componente: StatWithContext

const StatWithContext = ({ value, label, context }) => {
  // context = {
  //   benchmark: 3.5,  // Valore di riferimento
  //   national_avg: 4.0,
  //   interpretation: 'above_average',
  //   percentile: 68
  // }

  const diff = value - context.benchmark
  const diff_percentage = (diff / context.benchmark * 100).toFixed(1)

  return (
    <div className="stat-with-context">
      <div className="stat-main">
        <span className="stat-value">{value.toFixed(2)}</span>
        <span className="stat-label">{label}</span>
      </div>

      <div className="stat-context">
        {/* Indicatore visivo */}
        <div className="benchmark-bar">
          <div className="benchmark-marker" style={{ left: `${context.percentile}%` }}>
            <span className="marker-label">You</span>
          </div>
          <div className="percentile-label">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Confronto testuale */}
        <div className="comparison-text">
          <span className={diff > 0 ? 'positive' : 'negative'}>
            {diff > 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(2)} ({diff > 0 ? '+' : ''}{diff_percentage}%)
          </span>
          <span className="vs-label">vs. national average</span>
        </div>

        {/* Interpretazione */}
        <p className="interpretation">
          {context.interpretation === 'above_average' && 'This is above average for similar institutions'}
          {context.interpretation === 'below_average' && 'This is below average - consider improvement actions'}
          {context.interpretation === 'average' && 'This aligns with national trends'}
        </p>
      </div>
    </div>
  )
}
```

### UX Issue 3: Difficoltà Navigazione tra Dati

**Problema**: Passare da overview a dettagli richiede troppi click

**Soluzione**: Drill-Down Interattivo + Breadcrumbs

```javascript
// Implementare navigazione gerarchica

const InteractiveDashboard = () => {
  const [viewStack, setViewStack] = useState([
    { level: 'overview', title: 'Overview', data: null }
  ])

  const currentView = viewStack[viewStack.length - 1]

  const drillDown = (level, title, data) => {
    setViewStack([...viewStack, { level, title, data }])
  }

  const navigateBack = () => {
    if (viewStack.length > 1) {
      setViewStack(viewStack.slice(0, -1))
    }
  }

  return (
    <div className="interactive-dashboard">
      {/* Breadcrumbs */}
      <nav className="breadcrumbs">
        {viewStack.map((view, idx) => (
          <span key={idx}>
            <button
              onClick={() => setViewStack(viewStack.slice(0, idx + 1))}
              className={idx === viewStack.length - 1 ? 'active' : ''}
            >
              {view.title}
            </button>
            {idx < viewStack.length - 1 && <span> › </span>}
          </span>
        ))}
      </nav>

      {/* Contenuto dinamico */}
      {currentView.level === 'overview' && (
        <OverviewDashboard onDrillDown={drillDown} />
      )}

      {currentView.level === 'category' && (
        <CategoryView
          category={currentView.data.category}
          onDrillDown={drillDown}
        />
      )}

      {currentView.level === 'question' && (
        <QuestionDetailView question={currentView.data.question} />
      )}

      {/* Back button */}
      {viewStack.length > 1 && (
        <button className="back-btn" onClick={navigateBack}>
          ← Back to {viewStack[viewStack.length - 2].title}
        </button>
      )}
    </div>
  )
}

// Esempio: Chart cliccabile per drill-down
const ClickableCompetenceChart = ({ data, onDrillDown }) => {
  const handleBarClick = (entry) => {
    // Drill down su dettagli competenza
    onDrillDown('category', `${entry.competenza} Competence Details`, {
      category: entry.competenza
    })
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="competenza" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="Studenti"
          fill="#3b82f6"
          onClick={handleBarClick}
          cursor="pointer"
        />
        <Bar
          dataKey="Insegnanti"
          fill="#10b981"
          onClick={handleBarClick}
          cursor="pointer"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

### UX Issue 4: Grafici Non Accessibili

**Problema**: Utenti con disabilità visive o daltonismo non possono interpretare grafici

**Soluzione**: Accessibilità WCAG 2.1 AA

```javascript
// Palette colori accessibile (Color Blind Safe)

const ACCESSIBLE_COLORS = {
  // Palette per protanopia/deuteranopia (rosso-verde)
  primary: '#0077BB',      // Blu
  secondary: '#EE7733',    // Arancione
  tertiary: '#009988',     // Teal
  quaternary: '#CC3311',   // Rosso
  quinary: '#33BBEE',      // Ciano

  // Contrasto testo
  text_on_light: '#202020',
  text_on_dark: '#FFFFFF'
}

// Pattern fills per distinguere senza colore
const PATTERNS = {
  students: 'url(#pattern-stripes)',
  teachers: 'url(#pattern-dots)',
  training: 'url(#pattern-grid)'
}

const AccessibleBarChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <defs>
          {/* Pattern SVG per riempimenti */}
          <pattern id="pattern-stripes" patternUnits="userSpaceOnUse" width="4" height="4">
            <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke={ACCESSIBLE_COLORS.primary} strokeWidth="1" />
          </pattern>
          <pattern id="pattern-dots" patternUnits="userSpaceOnUse" width="6" height="6">
            <circle cx="3" cy="3" r="1.5" fill={ACCESSIBLE_COLORS.secondary} />
          </pattern>
        </defs>

        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="competenza" />
        <YAxis />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: `2px solid ${ACCESSIBLE_COLORS.primary}`,
            fontSize: '14px'  // Testo più grande
          }}
        />
        <Legend />

        <Bar
          dataKey="Studenti"
          fill={ACCESSIBLE_COLORS.primary}
          // Pattern fill come backup
          fillOpacity={0.8}
        >
          {/* Etichette su barre per utenti screen reader */}
          <LabelList
            dataKey="Studenti"
            position="top"
            style={{ fontSize: '12px', fontWeight: 'bold' }}
          />
        </Bar>

        <Bar
          dataKey="Insegnanti"
          fill={ACCESSIBLE_COLORS.secondary}
          fillOpacity={0.8}
        >
          <LabelList dataKey="Insegnanti" position="top" style={{ fontSize: '12px' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// Tabella dati alternativa (WCAG requirement)
const DataTable = ({ data, ariaLabel }) => {
  return (
    <div className="data-table-container" role="region" aria-label={ariaLabel}>
      <table className="accessible-table">
        <caption className="sr-only">{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Competenza</th>
            <th scope="col">Studenti (Media)</th>
            <th scope="col">Insegnanti (Media)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              <th scope="row">{row.competenza}</th>
              <td>{row.Studenti.toFixed(2)}</td>
              <td>{row.Insegnanti.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Toggle chart/table view
const AccessibleVisualization = ({ data, title }) => {
  const [viewMode, setViewMode] = useState('chart')  // 'chart' or 'table'

  return (
    <div className="visualization-wrapper">
      <div className="view-controls" role="toolbar" aria-label="View mode controls">
        <button
          onClick={() => setViewMode('chart')}
          aria-pressed={viewMode === 'chart'}
          className={viewMode === 'chart' ? 'active' : ''}
        >
          📊 Chart View
        </button>
        <button
          onClick={() => setViewMode('table')}
          aria-pressed={viewMode === 'table'}
          className={viewMode === 'table' ? 'active' : ''}
        >
          📋 Table View
        </button>
      </div>

      {viewMode === 'chart' ? (
        <AccessibleBarChart data={data} />
      ) : (
        <DataTable data={data} ariaLabel={title} />
      )}
    </div>
  )
}
```

---

## 🔍 Miglioramenti Analisi Comparativa

### Comparative Issue 1: Confronto Studenti-Insegnanti Limitato

**Problema**: Solo 3 domande speculari analizzate (competenze + fiducia)

**Soluzione**: Espandere analisi comparativa a tutte le dimensioni comuni

```python
# backend/app/analytics.py - ESTENDI get_comparative_analysis()

def get_comprehensive_comparison(self) -> Dict:
    """
    Analisi comparativa estesa con test statistici
    """
    students = self.db.query(StudentResponse).all()
    teachers = self.db.query(TeacherResponse).filter(...).all()

    comparisons = []

    # DIMENSIONE 1: Competenze
    for comp_type in ['practical_competence', 'theoretical_competence']:
        student_vals = [getattr(s, comp_type) for s in students if getattr(s, comp_type)]
        teacher_vals = [getattr(t, comp_type) for t in teachers if getattr(t, comp_type)]

        # T-test
        test_result = InferentialStats.independent_ttest(
            student_vals, teacher_vals,
            labels=("Students", "Teachers")
        )

        comparisons.append({
            "dimension": "Competenze",
            "variable": comp_type.replace('_', ' ').title(),
            "students": test_result["groups"]["Students"],
            "teachers": test_result["groups"]["Teachers"],
            "test": test_result["statistics"],
            "effect_size": test_result["effect_size"],
            "conclusion": test_result["conclusion"]["interpretation"]
        })

    # DIMENSIONE 2: Utilizzo
    # Chi-quadrato per uso quotidiano
    student_daily_yes = sum(1 for s in students if s.uses_ai_daily == 'Sì')
    student_daily_no = len(students) - student_daily_yes
    teacher_daily_yes = sum(1 for t in teachers if t.uses_ai_daily == 'Sì')
    teacher_daily_no = len(teachers) - teacher_daily_yes

    chi2_result = InferentialStats.chi_square_test(
        np.array([[student_daily_yes, student_daily_no],
                  [teacher_daily_yes, teacher_daily_no]]),
        row_labels=["Students", "Teachers"],
        col_labels=["Uses AI Daily", "Does Not Use"]
    )

    comparisons.append({
        "dimension": "Utilizzo",
        "variable": "Daily AI Usage",
        "students": {
            "yes_count": student_daily_yes,
            "yes_percentage": round(student_daily_yes / len(students) * 100, 1),
            "n": len(students)
        },
        "teachers": {
            "yes_count": teacher_daily_yes,
            "yes_percentage": round(teacher_daily_yes / len(teachers) * 100, 1),
            "n": len(teachers)
        },
        "test": chi2_result["statistics"],
        "effect_size": chi2_result["effect_size"],
        "conclusion": chi2_result["conclusion"]["interpretation"]
    })

    # DIMENSIONE 3: Ore utilizzo (t-test)
    student_hours = [s.hours_daily for s in students if s.hours_daily]
    teacher_hours = [t.hours_daily for t in teachers if t.hours_daily]

    hours_test = InferentialStats.independent_ttest(student_hours, teacher_hours,
                                                    labels=("Students", "Teachers"))

    comparisons.append({
        "dimension": "Intensità Utilizzo",
        "variable": "Hours per Day",
        "students": hours_test["groups"]["Students"],
        "teachers": hours_test["groups"]["Teachers"],
        "test": hours_test["statistics"],
        "effect_size": hours_test["effect_size"],
        "conclusion": hours_test["conclusion"]["interpretation"]
    })

    # DIMENSIONE 4: Fiducia e preoccupazioni
    # ... (similar logic)

    # SUMMARY: Quali dimensioni mostrano differenze significative?
    significant_diffs = [c for c in comparisons if c["test"]["p_value"] < 0.05]

    return {
        "comparisons": comparisons,
        "summary": {
            "total_comparisons": len(comparisons),
            "significant_differences": len(significant_diffs),
            "percentage_significant": round(len(significant_diffs) / len(comparisons) * 100, 1),
            "key_findings": [
                {
                    "variable": c["variable"],
                    "conclusion": c["conclusion"],
                    "effect_size": c["effect_size"]["interpretation"]
                }
                for c in significant_diffs
            ]
        },
        "methodology": {
            "continuous_variables": "Independent t-test (two-tailed, α=0.05)",
            "categorical_variables": "Chi-square test of independence (α=0.05)",
            "effect_sizes": "Cohen's d (continuous), Cramer's V (categorical)",
            "assumptions_checked": True
        }
    }
```

---

## 📦 Deliverables - Checklist Implementazione

### Fase 1: Statistica Inferenziale ✅
- [ ] File `backend/app/statistics.py` con classi:
  - [ ] `InferentialStats.independent_ttest()`
  - [ ] `InferentialStats.chi_square_test()`
  - [ ] `InferentialStats.one_way_anova()`
- [ ] Endpoint API:
  - [ ] `GET /api/statistics/ttest/{variable}`
  - [ ] `GET /api/statistics/chi-square/usage`
  - [ ] `GET /api/statistics/anova/competence-by-school`
- [ ] Frontend: Componenti per visualizzare risultati test
- [ ] Test unitari per funzioni statistiche
- [ ] Documentazione metodologica in `STATISTICAL_METHODS.md`

### Fase 2: Correlazioni e Regressioni ✅
- [ ] `CorrelationAnalysis.correlation_matrix()` in `statistics.py`
- [ ] `RegressionAnalysis.multiple_regression()` in `statistics.py`
- [ ] Endpoint:
  - [ ] `GET /api/statistics/correlation-matrix`
  - [ ] `GET /api/statistics/regression/practical-competence`
  - [ ] `GET /api/statistics/regression/trust-integration`
- [ ] Frontend: Heatmap correlazioni
- [ ] Frontend: Scatter plot con regression line
- [ ] Interpretazione automatica predittori top

### Fase 3: Visualizzazioni Avanzate ✅
- [ ] Modifiche backend per aggiungere CI a tutte le statistiche
- [ ] Componenti React:
  - [ ] `ErrorBarChart.jsx` (barre con error bars)
  - [ ] `DistributionBoxPlot.jsx` (box plot)
  - [ ] `CorrelationHeatmap.jsx` (heatmap interattiva)
  - [ ] `ScatterWithRegression.jsx` (scatter + linea)
- [ ] Export grafici in SVG/PNG high-res
- [ ] Palette colori accessibile (color-blind safe)
- [ ] Toggle view chart/table per WCAG

### Fase 4: Analisi Avanzate ✅
- [ ] File `backend/app/advanced_analytics.py`:
  - [ ] `ClusteringAnalysis.kmeans_clustering()`
  - [ ] `TextAnalysis.extract_keywords()`
  - [ ] `TextAnalysis.sentiment_analysis_simple()`
- [ ] Endpoint:
  - [ ] `GET /api/advanced/clustering/students`
  - [ ] `GET /api/advanced/text-analysis/open-responses`
- [ ] Frontend: PCA scatter plot per cluster
- [ ] Frontend: Word cloud per keywords
- [ ] Frontend: Sentiment distribution chart

### UX Improvements ✅
- [ ] `DashboardInsights.jsx` con sistema insights prioritizzati
- [ ] `StatWithContext.jsx` con benchmarking e percentili
- [ ] `InteractiveDashboard.jsx` con breadcrumbs e drill-down
- [ ] `AccessibleVisualization.jsx` (WCAG 2.1 AA compliant)
- [ ] Loading states e skeleton screens
- [ ] Responsive design per mobile/tablet
- [ ] Export report PDF con tutti i grafici

---

## 🧪 Validazione Piano

### Validità Scientifica

**Rigorosa (Publication-Ready)**:
- ✅ Test di significatività statistica
- ✅ Effect sizes riportati
- ✅ Intervalli di confidenza
- ✅ Verifica assunzioni (normalità, omogeneità varianze)
- ✅ Correzioni per confronti multipli (Bonferroni, Tukey)
- ✅ Analisi potenza statistica (post-hoc)
- ✅ Reporting secondo APA 7th guidelines

### Completezza Analitica

**Dataset Utilizzato a Pieno**:
- ✅ 270 studenti + 455 insegnanti (oltre 700 osservazioni)
- ✅ Tutte le variabili scale (1-7) analizzate
- ✅ Variabili categoriche (genere, scuola, età) integrate
- ✅ Risposte aperte processate (text mining)
- ✅ Strumenti AI analizzati (network analysis possibile)

### User Experience

**Intuitiva e Accessibile**:
- ✅ Progressive disclosure (informazioni graduali)
- ✅ Insights automatici evidenziati
- ✅ Navigazione drill-down senza perdere contesto
- ✅ WCAG 2.1 AA compliance
- ✅ Export per report/presentazioni

---

## 📊 Metriche di Successo

**KPI Post-Implementazione**:

1. **Rigor Scientifico**:
   - 100% comparazioni con test significatività
   - 100% statistiche con IC 95%
   - ≥80% grafici con error bars

2. **Insights Actionable**:
   - ≥10 insights automatici generati
   - ≥5 raccomandazioni evidence-based

3. **UX**:
   - Task completion rate >90% (usability test)
   - Time to insight <2 minuti (vs current ~5 min)
   - Accessibilità: WCAG 2.1 AA validator pass

4. **Adoption (Ricercatori)**:
   - ≥80% preferisce nuova dashboard vs old
   - ≥3 pubblicazioni scientifiche basate su analisi

---

## 📝 Note Implementazione

### Priorità Raccomandata

**Sprint 1 (2 settimane)**: FASE 1 - Statistica Inferenziale
- **Impatto**: ⭐⭐⭐⭐⭐ (critico per validità scientifica)
- **Effort**: Medium

**Sprint 2 (2 settimane)**: FASE 3 - Visualizzazioni + UX Basics
- **Impatto**: ⭐⭐⭐⭐⭐ (user experience immediata)
- **Effort**: Medium-High

**Sprint 3 (2 settimane)**: FASE 2 - Correlazioni/Regressioni
- **Impatto**: ⭐⭐⭐⭐ (insights avanzati)
- **Effort**: Medium

**Sprint 4 (3 settimane)**: FASE 4 - Analisi Avanzate (opzionale)
- **Impatto**: ⭐⭐⭐ (nice-to-have, valore aggiunto)
- **Effort**: High

### Dipendenze Tecniche

**Python Packages da Aggiungere**:
```bash
# requirements.txt - AGGIUNTE
scipy==1.11.3              # Test statistici
scikit-learn==1.3.1        # Clustering, regressioni
statsmodels==0.14.0        # Modelli statistici avanzati
pandas==2.1.1              # Manipolazione dati
spacy==3.6.1               # NLP per text analysis
it-core-news-sm==3.6.0     # Modello italiano spaCy
wordcloud==1.9.2           # Word clouds (opzionale)
```

**Frontend Packages**:
```bash
# package.json - AGGIUNTE
"victory": "^36.6.11",           # Box plots, grafici avanzati
"react-wordcloud": "^1.2.7",     # Word clouds
"react-plotly.js": "^2.6.0",     # Heatmaps interattive
"plotly.js": "^2.26.0"
```

### Risk Mitigation

**Rischio**: Performance degradation con calcoli statistici pesanti

**Mitigazione**:
- Cache aggressiva (TTL 1h per statistiche)
- Calcoli asincroni per analisi pesanti (Celery worker)
- Lazy loading componenti analisi avanzate
- Pagination per tabelle grandi
- Debounce su filtri interattivi

---

**Fine Piano di Miglioramento**

*Questo documento è una roadmap tecnica completa. Per domande specifiche su implementazione, contattare il team di sviluppo.*
