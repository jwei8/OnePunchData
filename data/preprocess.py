# RUN CODE TO GENERATE THE PREPROCESSED DATA AND SAVE INTO anime_processed.csv


import pandas as pd
import numpy as np

def update_genre(row, genre_priority_list):
    genres = row['Genres'].split(', ')
    for genre_i in genres:
        if genre_i in genre_priority_list:
            return genre_i
    return genres[0]

pd.set_option('display.max_columns', None)

df = pd.read_csv('anime.csv')

# Define the columns to filter
columns_to_filter = [
    'MAL_ID',     # Categorical
    "Name",       # Categorical
    "Score",      # Quantitative
    "Genres",     # Categorical
    "Studios",    # Categorical
    "Source",     # Categorical
    "Rating",     # Ordinal
    "Completed",  # Quantitative
    "Dropped",    # Quantitative
    "Premiered",  # Ordinal
]

# Include the MAL_ID column
columns_to_keep = columns_to_filter

# Apply the filters to the dataframe
filtered_df = df.copy()
for column in columns_to_filter:
    if filtered_df[column].dtype == object:  # For string columns
        filtered_df = filtered_df[
            (filtered_df[column].notna()) &
            (filtered_df[column].str.lower() != "unknown") &
            (filtered_df[column] != "")
        ]
    else:  # For numeric columns
        filtered_df = filtered_df[filtered_df[column].notna()]

# Keep only the columns in columns_to_keep
df = filtered_df[columns_to_keep]

# Filter out all animes that have genres not in the list
genres_list = ['Action', 'Comedy', 'Slice of Life', 'Adventure', 'Drama', 'Mystery', 'Sci-Fi', 'Music', 'Game', 'Harem']
df['Genres'] = df.apply(lambda row: update_genre(row, genres_list), axis=1)
df = df[df['Genres'].isin(genres_list)]

top_1000_animes = df.sort_values(by='Score', ascending=False).head(1000)
top_1000_animes['Score'] = pd.to_numeric(df['Score'], errors='coerce')

# Count the occurrences of each unique first genre
genre_counts = top_1000_animes['Genres'].value_counts()
source_counts = top_1000_animes['Source'].value_counts()
rating_counts = top_1000_animes['Rating'].value_counts()

# Print the counts
print(top_1000_animes.info())
print(top_1000_animes.describe(include='all'))
print(genre_counts)
print(source_counts)
print(rating_counts)

top_1000_animes.rename(columns={'Genres':'Genre'}, inplace=True)

top_1000_animes.to_csv('anime_processed.csv', index=False)