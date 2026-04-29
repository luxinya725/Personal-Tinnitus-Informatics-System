import pandas as pd

from src.transformations import build_daily_records


class Pipeline:
    def __init__(self, data_path: str, output_path: str = "output"):
        self.data_path = data_path
        self.output_path = output_path
        self.df: pd.DataFrame | None = None
        self.result: pd.DataFrame | None = None

    def extract(self) -> None:
        print(f"\tReading {self.data_path}")
        self.df = pd.read_csv(self.data_path)
        print(f"\t{len(self.df)} rows loaded")

    def transform(self) -> None:
        self.result = build_daily_records(self.df)
        print(f"\t{len(self.result)} daily records, {len(self.result.columns)} columns")

    def load(self) -> None:
        csv_path = f"{self.output_path}.csv"
        json_path = f"{self.output_path}.json"

        self.result.to_csv(csv_path, index=False)
        print(f"\tSaved CSV → {csv_path}")

        self.result.to_json(json_path, orient="records", indent=2)
        print(f"\tSaved JSON → {json_path}")

    def run(self) -> None:
        print("Running pipeline")
        print("Extracting")
        self.extract()
        print("Transforming")
        self.transform()
        print("Loading")
        self.load()
        print("Done")