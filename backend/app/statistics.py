"""
Modulo per analisi statistica inferenziale.
Implementa test statistici per confronti tra gruppi e analisi di significatività.
Include anche analisi di correlazione e regressione.
"""

from scipy import stats
from scipy.stats import pearsonr, spearmanr
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error


def calculate_mean_with_ci(values: List[float], confidence: float = 0.95) -> Dict:
    """
    Calcola media con intervallo di confidenza e statistiche descrittive.

    Args:
        values: Lista di valori numerici
        confidence: Livello di confidenza (default 0.95 per 95%)

    Returns:
        Dizionario con mean, sd, se, ci_lower, ci_upper, n
    """
    if not values or len(values) == 0:
        return {
            "mean": 0,
            "sd": 0,
            "se": 0,
            "ci_lower": 0,
            "ci_upper": 0,
            "n": 0,
            "median": 0,
            "confidence_level": confidence
        }

    n = len(values)
    mean = np.mean(values)
    sd = np.std(values, ddof=1)
    se = sd / np.sqrt(n)

    # t-distribution per intervallo di confidenza
    t_crit = stats.t.ppf((1 + confidence) / 2, n - 1)
    margin = t_crit * se

    return {
        "mean": round(float(mean), 2),
        "sd": round(float(sd), 2),
        "se": round(float(se), 3),
        "ci_lower": round(float(mean - margin), 2),
        "ci_upper": round(float(mean + margin), 2),
        "n": int(n),
        "median": round(float(np.median(values)), 2),
        "confidence_level": confidence
    }


class InferentialStats:
    """Analisi statistica inferenziale per confronti tra gruppi."""

    @staticmethod
    def independent_ttest(
        group1: List[float],
        group2: List[float],
        labels: Tuple[str, str] = ("Group1", "Group2")
    ) -> Dict:
        """
        T-test indipendente con effect size e intervallo di confidenza.

        Args:
            group1: Lista di valori numerici per il primo gruppo
            group2: Lista di valori numerici per il secondo gruppo
            labels: Tupla con nomi dei due gruppi

        Returns:
            Dizionario con statistiche complete del t-test:
            - test_type: Tipo di test usato (Student's o Welch's)
            - groups: Statistiche descrittive per ogni gruppo
            - statistics: t-statistic, df, p-value, differenza medie, CI 95%
            - effect_size: Cohen's d con interpretazione
            - assumptions: Risultati test di normalità e omogeneità varianze
            - conclusion: Interpretazione del risultato
        """
        # Verifica normalità (Shapiro-Wilk per n < 5000)
        _, p_norm1 = stats.shapiro(group1) if len(group1) < 5000 else (None, 1)
        _, p_norm2 = stats.shapiro(group2) if len(group2) < 5000 else (None, 1)

        # Levene test per omogeneità varianze
        _, p_levene = stats.levene(group1, group2)

        # T-test (Welch se varianze diverse)
        equal_var = p_levene > 0.05
        t_stat, p_value = stats.ttest_ind(group1, group2, equal_var=equal_var)

        # Cohen's d (effect size)
        mean_diff = np.mean(group1) - np.mean(group2)
        pooled_std = np.sqrt((np.std(group1, ddof=1)**2 + np.std(group2, ddof=1)**2) / 2)
        cohens_d = mean_diff / pooled_std if pooled_std > 0 else 0

        # Interpretazione effect size (Cohen, 1988)
        if abs(cohens_d) < 0.2:
            effect_interp = "negligible"
        elif abs(cohens_d) < 0.5:
            effect_interp = "small"
        elif abs(cohens_d) < 0.8:
            effect_interp = "medium"
        else:
            effect_interp = "large"

        # Intervallo di confidenza 95% per differenza medie
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
                "p_value": round(p_value, 5) if p_value >= 0.00001 else p_value,
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
                "significant": bool(p_value < 0.05),
                "alpha": 0.05,
                "interpretation": f"{'Significant' if p_value < 0.05 else 'No significant'} difference (p={'<0.001' if p_value < 0.001 else f'={round(p_value, 3)}'}) with {effect_interp} effect size"
            }
        }

    @staticmethod
    def chi_square_test(
        contingency_table: np.ndarray,
        row_labels: List[str],
        col_labels: List[str]
    ) -> Dict:
        """
        Test chi-quadrato per indipendenza tra variabili categoriche.

        Args:
            contingency_table: Tabella di contingenza (righe x colonne)
            row_labels: Etichette delle righe
            col_labels: Etichette delle colonne

        Returns:
            Dizionario con risultati del test chi-quadrato:
            - test_type: Nome del test
            - contingency_table: Tabelle osservate, attese, percentuali
            - statistics: Chi-square, df, p-value, n
            - effect_size: Cramer's V con interpretazione
            - conclusion: Interpretazione del risultato
        """
        chi2, p_value, dof, expected = stats.chi2_contingency(contingency_table)

        # Cramer's V (effect size per chi-quadrato)
        n = np.sum(contingency_table)
        min_dim = min(len(row_labels), len(col_labels)) - 1
        cramers_v = np.sqrt(chi2 / (n * min_dim))

        # Interpretazione Cramer's V (Cohen, 1988)
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

        # Calcola percentuali per riga
        row_totals = contingency_table.sum(axis=1)
        percentages = (contingency_table.T / row_totals * 100).T

        return {
            "test_type": "Chi-square test of independence",
            "contingency_table": {
                "observed": contingency_table.tolist(),
                "expected": expected.round(2).tolist(),
                "row_labels": row_labels,
                "col_labels": col_labels,
                "percentages": percentages.round(1).tolist()
            },
            "statistics": {
                "chi_square": round(chi2, 3),
                "df": dof,
                "p_value": round(p_value, 5) if p_value >= 0.00001 else p_value,
                "n": int(n)
            },
            "effect_size": {
                "cramers_v": round(cramers_v, 3),
                "interpretation": effect_interp
            },
            "conclusion": {
                "significant": bool(p_value < 0.05),
                "interpretation": f"Variables are {'dependent' if p_value < 0.05 else 'independent'} (p={'<0.001' if p_value < 0.001 else f'={round(p_value, 3)}'}) with {effect_interp} effect size"
            }
        }

    @staticmethod
    def one_way_anova(groups: Dict[str, List[float]]) -> Dict:
        """
        ANOVA one-way con post-hoc Tukey HSD per confronti multipli.

        Args:
            groups: Dizionario con nome gruppo → lista valori
                    Es: {"Primaria": [4.5, 5.2, ...], "Secondaria": [3.8, 4.1, ...]}

        Returns:
            Dizionario con risultati dell'ANOVA:
            - test_type: Nome del test
            - groups: Statistiche descrittive per ogni gruppo
            - statistics: F-statistic, df, p-value
            - effect_size: Eta squared con interpretazione
            - posthoc: Confronti pairwise con Tukey HSD (se significativo)
            - conclusion: Interpretazione del risultato
        """
        group_names = list(groups.keys())
        group_values = list(groups.values())

        # ANOVA one-way
        f_stat, p_value = stats.f_oneway(*group_values)

        # Eta squared (effect size): SS_between / SS_total
        all_values = np.concatenate(group_values)
        grand_mean = np.mean(all_values)

        ss_between = sum(len(g) * (np.mean(g) - grand_mean)**2 for g in group_values)
        ss_total = sum((x - grand_mean)**2 for x in all_values)
        eta_squared = ss_between / ss_total if ss_total > 0 else 0

        # Interpretazione effect size (Cohen, 1988)
        if eta_squared < 0.01:
            effect_interp = "negligible"
        elif eta_squared < 0.06:
            effect_interp = "small"
        elif eta_squared < 0.14:
            effect_interp = "medium"
        else:
            effect_interp = "large"

        # Post-hoc Tukey HSD (solo se p < 0.05)
        posthoc = None
        if p_value < 0.05 and len(group_names) > 2:
            try:
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
                            "mean_diff": round(float(np.mean(group_values[i]) - np.mean(group_values[j])), 2),
                            "p_adjusted": round(float(p_adj), 4),
                            "significant": bool(p_adj < 0.05)
                        }
                        posthoc["pairwise_comparisons"].append(comparison)
                        if p_adj < 0.05:
                            posthoc["significant_pairs"].append(f"{group_names[i]} vs {group_names[j]}")
            except ImportError:
                # Fallback se tukey_hsd non disponibile (scipy < 1.11)
                posthoc = {
                    "note": "Post-hoc test requires scipy >= 1.11.0"
                }

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
                "p_value": round(p_value, 5) if p_value >= 0.00001 else p_value
            },
            "effect_size": {
                "eta_squared": round(eta_squared, 3),
                "interpretation": effect_interp
            },
            "posthoc": posthoc,
            "conclusion": {
                "significant": bool(p_value < 0.05),
                "interpretation": f"Group means are {'different' if p_value < 0.05 else 'not significantly different'} (p={'<0.001' if p_value < 0.001 else f'={round(p_value, 3)}'}) with {effect_interp} effect size"
            }
        }


class CorrelationAnalysis:
    """Analisi di correlazione tra variabili."""

    @staticmethod
    def point_biserial_correlation(continuous: np.ndarray, dichotomous: np.ndarray) -> tuple:
        """
        Calcola correlazione punto-biseriale tra variabile continua e dicotomica.

        Args:
            continuous: Array di valori continui
            dichotomous: Array di valori 0/1

        Returns:
            (r_pb, p_value): Coefficiente punto-biseriale e p-value
        """
        from scipy.stats import pointbiserialr
        return pointbiserialr(dichotomous, continuous)

    @staticmethod
    def correlation_matrix(data: pd.DataFrame, method: str = "pearson") -> Dict:
        """
        Calcola matrice di correlazione con test di significatività.

        Args:
            data: DataFrame con variabili continue (ogni colonna = una variabile)
            method: 'pearson' (default) o 'spearman'

        Returns:
            Dizionario con:
            - method: Metodo usato
            - variables: Lista nomi variabili
            - correlation_matrix: Matrice correlazioni (n x n)
            - p_value_matrix: Matrice p-values (n x n)
            - significant_correlations: Lista correlazioni significative ordinate per forza
            - interpretation: Statistiche aggregate
        """
        if method not in ['pearson', 'spearman']:
            raise ValueError("method must be 'pearson' or 'spearman'")

        variables = data.columns.tolist()
        n = len(variables)

        corr_matrix = np.zeros((n, n))
        p_matrix = np.zeros((n, n))

        # Calcola correlazioni pairwise
        for i, var1 in enumerate(variables):
            for j, var2 in enumerate(variables):
                if i == j:
                    corr_matrix[i, j] = 1.0
                    p_matrix[i, j] = 0.0
                elif i < j:
                    # Rimuovi valori mancanti
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
                    r_val = corr_matrix[i, j]

                    # Interpretazione forza correlazione (Cohen, 1988)
                    if abs(r_val) >= 0.7:
                        strength = "very strong"
                    elif abs(r_val) >= 0.5:
                        strength = "strong"
                    elif abs(r_val) >= 0.3:
                        strength = "moderate"
                    else:
                        strength = "weak"

                    significant_pairs.append({
                        "var1": variables[i],
                        "var2": variables[j],
                        "correlation": round(float(r_val), 3),
                        "p_value": round(float(p_matrix[i, j]), 5) if p_matrix[i, j] >= 0.00001 else float(p_matrix[i, j]),
                        "strength": strength,
                        "direction": "positive" if r_val > 0 else "negative",
                        "n_observations": int((~(data[variables[i]].isna() | data[variables[j]].isna())).sum())
                    })

        # Ordina per forza assoluta della correlazione
        significant_pairs.sort(key=lambda x: abs(x["correlation"]), reverse=True)

        # Sostituisci NaN/Inf con None per JSON compliance
        corr_matrix_clean = np.where(np.isfinite(corr_matrix), corr_matrix, 0)
        p_matrix_clean = np.where(np.isfinite(p_matrix), p_matrix, 1)

        return {
            "method": method,
            "variables": variables,
            "correlation_matrix": corr_matrix_clean.round(3).tolist(),
            "p_value_matrix": p_matrix_clean.round(5).tolist(),
            "significant_correlations": significant_pairs,
            "interpretation": {
                "total_comparisons": n * (n - 1) // 2,
                "significant_count": len(significant_pairs),
                "percentage_significant": round(len(significant_pairs) / (n * (n - 1) // 2) * 100, 1) if n > 1 else 0,
                "strongest_correlation": significant_pairs[0] if significant_pairs else None
            }
        }


class RegressionAnalysis:
    """Analisi di regressione multipla."""

    @staticmethod
    def multiple_regression(
        X: pd.DataFrame,
        y: pd.Series,
        feature_names: List[str]
    ) -> Dict:
        """
        Regressione lineare multipla con diagnostica completa.

        Args:
            X: DataFrame con variabili predittive (features)
            y: Serie con variabile target
            feature_names: Nomi delle features

        Returns:
            Dizionario con:
            - model_summary: R², R² adjusted, RMSE, intercetta, n
            - coefficients: Lista coefficienti per ogni feature
            - residuals: Statistiche sui residui
            - interpretation: Interpretazione automatica risultati
        """
        # Rimuovi righe con valori mancanti
        valid = ~(y.isna() | X.isna().any(axis=1))
        X_clean = X[valid]
        y_clean = y[valid]

        if len(X_clean) < 10:
            raise ValueError("Insufficient data for regression (need at least 10 observations)")

        # Fit modello
        model = LinearRegression()
        model.fit(X_clean, y_clean)

        # Predizioni
        y_pred = model.predict(X_clean)

        # R² e R² adjusted
        r2 = r2_score(y_clean, y_pred)
        n = len(y_clean)
        p = X_clean.shape[1]
        adj_r2 = 1 - (1 - r2) * (n - 1) / (n - p - 1)

        # RMSE
        rmse = np.sqrt(mean_squared_error(y_clean, y_pred))

        # Coefficienti con beta standardizzati
        coefficients = []
        for i, name in enumerate(feature_names):
            # Beta standardizzato: b * (SD_x / SD_y)
            std_x = X_clean.iloc[:, i].std()
            std_y = y_clean.std()
            beta_std = model.coef_[i] * (std_x / std_y) if std_y > 0 else 0

            coefficients.append({
                "feature": name,
                "coefficient": round(float(model.coef_[i]), 4),
                "std_coefficient": round(float(beta_std), 4),
                "interpretation": f"1 unit ↑ in {name} → {round(float(model.coef_[i]), 3)} unit change in outcome"
            })

        # Residui
        residuals = y_clean - y_pred

        # Ordina coefficienti per importanza (beta standardizzato assoluto)
        coefficients_sorted = sorted(coefficients, key=lambda x: abs(x["std_coefficient"]), reverse=True)

        return {
            "model_summary": {
                "n_observations": int(n),
                "n_features": int(p),
                "r_squared": round(float(r2), 4),
                "adjusted_r_squared": round(float(adj_r2), 4),
                "rmse": round(float(rmse), 3),
                "intercept": round(float(model.intercept_), 4)
            },
            "coefficients": coefficients,
            "residuals": {
                "mean": round(float(residuals.mean()), 4),
                "std": round(float(residuals.std()), 4),
                "min": round(float(residuals.min()), 3),
                "max": round(float(residuals.max()), 3)
            },
            "interpretation": {
                "variance_explained": f"{round(r2*100, 1)}% of variance in outcome is explained by predictors",
                "model_fit": (
                    "Excellent" if r2 > 0.7 else
                    "Good" if r2 > 0.5 else
                    "Moderate" if r2 > 0.3 else
                    "Weak"
                ),
                "top_predictors": coefficients_sorted[:3]
            }
        }
