from src.pipeline import Pipeline

def main():

    pipeline = Pipeline(
        data_path = 'data/bearable-export-25-03-2026.csv' 
        )
    
    pipeline.run()

if __name__ == "__main__":
    main()
