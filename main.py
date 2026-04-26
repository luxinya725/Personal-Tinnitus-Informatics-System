from src.pipeline import Pipeline

def main():

    pipeline = Pipeline(
        data_path = 'data/bearable-export-25-04-2026.csv',
        output_path = 'data/output/tinnitus_data'
        )
    
    pipeline.run()

if __name__ == "__main__":
    main()
