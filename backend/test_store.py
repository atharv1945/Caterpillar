import pandas as pd
from app.store import update_row, append_row

def test_update_row():
    df = pd.DataFrame([{"id": "1", "val": "A"}, {"id": "2", "val": "B"}])
    updated_df = update_row(df, "id", "2", {"val": "C"})
    assert updated_df.loc[updated_df["id"] == "2", "val"].values[0] == "C"

def test_append_row():
    df = pd.DataFrame([{"id": "1", "val": "A"}])
    updated_df = append_row(df, {"id": "2", "val": "B"})
    assert len(updated_df) == 2
    assert updated_df.iloc[1]["val"] == "B"

if __name__ == "__main__":
    test_update_row()
    test_append_row()
    print("Store tests passed!")
