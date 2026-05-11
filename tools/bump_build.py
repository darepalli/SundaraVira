import argparse
import datetime as dt
import pathlib
import re
import sys

VERSION_FILE = pathlib.Path("src/config/version.js")


def fail(msg: str) -> None:
    print(msg, file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Increment SundaraVira build number or set a new major release."
    )
    parser.add_argument(
        "--major",
        type=int,
        help="Set a major version (e.g. 2), reset minor to 0 and build to 1.",
    )
    args = parser.parse_args()

    if not VERSION_FILE.exists():
        fail(f"Version file not found: {VERSION_FILE}")

    text = VERSION_FILE.read_text(encoding="utf-8")

    major_match = re.search(r"major:\s*(\d+)", text)
    minor_match = re.search(r"minor:\s*(\d+)", text)
    build_match = re.search(r"build:\s*(\d+)", text)

    if not (major_match and minor_match and build_match):
        fail("Could not parse major/minor/build from version.js")

    major = int(major_match.group(1))
    minor = int(minor_match.group(1))
    build = int(build_match.group(1))

    if args.major is not None:
        if args.major < 1:
            fail("Major version must be >= 1")
        major = args.major
        minor = 0
        build = 1
    else:
        build += 1

    today = dt.date.today().isoformat()

    text = re.sub(r"major:\s*\d+", f"major: {major}", text)
    text = re.sub(r"minor:\s*\d+", f"minor: {minor}", text)
    text = re.sub(r"build:\s*\d+", f"build: {build}", text)
    text = re.sub(r'updatedAt:\s*"[^"]*"', f'updatedAt: "{today}"', text)

    VERSION_FILE.write_text(text, encoding="utf-8")
    print(f"Updated to Version {major}.{minor} Build {build}")


if __name__ == "__main__":
    main()
