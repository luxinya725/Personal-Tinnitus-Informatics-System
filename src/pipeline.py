import pandas as pd
from src.transformations import *
# Parse column names, parse dates

class Pipeline:


    def __init__(
            self,
            data_path: str,
            ):
        
        self.data_path = data_path

        self.df = None

    def extract(self):
        self.df = pd.read_csv(self.data_path)

    def transform(self):
        self.df['date formatted'] = pd.to_datetime(self.df['date formatted'])

    def load(self):
        pass

    

    def run(self):
        print("Running processing pipeline")

        print("Extracting")
        self.extract()
        
        print("Transforming")
        self.transform()

        print("Loading to target path")
        self.load()    

        print(self.df['date formatted'])
        
        print("Finished pipeline")