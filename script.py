#!/usr/bin/env python3

"""
The script generates a branch manifest file in the format needed by
catalyst downloader.
"""

import os
import pathlib
import json


def clean_branch_name(branch_name: str) -> str:
    return branch_name.replace("/", "-")


def main():
    """main entrypoint for the script."""
    ref_name = clean_branch_name(str(os.getenv("INPUT_REF-NAME")))
    manifest = {
        "ref": os.getenv("INPUT_REF"),
        "branch": ref_name,
        "commit": os.getenv("INPUT_COMMIT"),
        "builds": {},
        "srcFilenames": {},
    }
    path = pathlib.Path(f"{ref_name}.json")
    path.write_text(json.dumps(manifest), "utf-8")


if __name__ == "__main__":
    main()
