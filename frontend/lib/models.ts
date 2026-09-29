export interface ModelResult {
  model: string
  mse: number
  mae: number
  r2: number
  accuracy: number
}

// Source: model_comparison_results.csv (flood-risk ML model benchmark)
export const MODEL_RESULTS: ModelResult[] = [
  {
    model: "Linear Regression",
    mse: 8.205733782107132e-14,
    mae: 2.479684539036242e-7,
    r2: 0.9999999999996305,
    accuracy: 99.99999136626494,
  },
  {
    model: "Random Forest",
    mse: 0.0015761487461406034,
    mae: 0.017325906263736302,
    r2: 0.9929039981056059,
    accuracy: 99.39674873084878,
  },
  {
    model: "XGBoost",
    mse: 0.002347555463763197,
    mae: 0.0333263335356576,
    r2: 0.9894310368492513,
    accuracy: 98.83964782589061,
  },
  {
    model: "Gradient Boosting",
    mse: 0.002095810266785013,
    mae: 0.03168855574532473,
    r2: 0.9905644225141741,
    accuracy: 98.89667177116462,
  },
]
