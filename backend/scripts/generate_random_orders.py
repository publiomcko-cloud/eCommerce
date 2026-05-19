import argparse
import csv
import random
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT_PATH = ROOT_DIR / "data" / "generated_orders_1000.csv"
DATE_RANGE_START = date(2025, 1, 1)
DATE_RANGE_END = date(2026, 4, 29)
CSV_HEADERS = [
    "source_record_id",
    "order_date",
    "customer_id",
    "product_id",
    "product_name",
    "category",
    "region",
    "channel",
    "quantity",
    "unit_price",
    "total_amount",
]


@dataclass(frozen=True, slots=True)
class ProductDefinition:
    product_id: str
    product_name: str
    category: str
    min_price: float
    max_price: float


PRODUCTS = [
    ProductDefinition("prod-101", "Wireless Mouse", "electronics", 55.0, 180.0),
    ProductDefinition("prod-102", "Notebook 14", "electronics", 2200.0, 4100.0),
    ProductDefinition("prod-103", "Portable Projector", "electronics", 320.0, 980.0),
    ProductDefinition("prod-104", "Mechanical Keyboard", "electronics", 180.0, 520.0),
    ProductDefinition("prod-105", "Smart Speaker", "electronics", 150.0, 420.0),
    ProductDefinition("prod-201", "Coffee Maker", "home", 130.0, 360.0),
    ProductDefinition("prod-202", "Desk Lamp", "home", 45.0, 160.0),
    ProductDefinition("prod-203", "Air Fryer", "home", 240.0, 690.0),
    ProductDefinition("prod-204", "Blender", "home", 90.0, 340.0),
    ProductDefinition("prod-205", "Vacuum Cleaner", "home", 280.0, 920.0),
    ProductDefinition("prod-301", "Yoga Mat", "fitness", 40.0, 150.0),
    ProductDefinition("prod-302", "Adjustable Dumbbells", "fitness", 260.0, 980.0),
    ProductDefinition("prod-303", "Protein Blender Bottle", "fitness", 18.0, 55.0),
    ProductDefinition("prod-401", "Office Chair", "furniture", 420.0, 1450.0),
    ProductDefinition("prod-402", "Standing Desk", "furniture", 680.0, 2200.0),
    ProductDefinition("prod-403", "Bookshelf", "furniture", 190.0, 760.0),
    ProductDefinition("prod-501", "Backpack", "accessories", 70.0, 260.0),
    ProductDefinition("prod-502", "Travel Mug", "accessories", 18.0, 75.0),
    ProductDefinition("prod-503", "Noise Cancelling Headphones", "accessories", 360.0, 1400.0),
    ProductDefinition("prod-504", "Webcam", "accessories", 120.0, 490.0),
]

REGIONS = ["southeast", "south", "northeast", "north", "midwest"]
CHANNELS = ["online", "marketplace", "partner", "physical_store", "phone_sales"]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate a deterministic random CSV dataset for DataPulse BI."
    )
    parser.add_argument(
        "--count",
        type=int,
        default=1000,
        help="Number of random orders to generate.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=20260429,
        help="Seed value for deterministic random generation.",
    )
    parser.add_argument(
        "--output-path",
        default=str(DEFAULT_OUTPUT_PATH),
        help="Where the generated CSV should be written.",
    )
    return parser


def random_order_date(rng: random.Random) -> date:
    total_days = (DATE_RANGE_END - DATE_RANGE_START).days
    return DATE_RANGE_START + timedelta(days=rng.randint(0, total_days))


def random_customer_id(rng: random.Random) -> str:
    return f"cust-rand-{rng.randint(1, 350):03d}"


def format_money(value: float) -> str:
    return f"{value:.2f}"


def build_row(index: int, rng: random.Random) -> dict[str, str]:
    product = rng.choice(PRODUCTS)
    quantity = rng.randint(1, 8)
    unit_price = round(rng.uniform(product.min_price, product.max_price), 2)
    total_amount = round(quantity * unit_price, 2)
    include_total_amount = rng.random() >= 0.18

    return {
        "source_record_id": f"generated-order-{index:05d}",
        "order_date": random_order_date(rng).isoformat(),
        "customer_id": random_customer_id(rng),
        "product_id": product.product_id,
        "product_name": product.product_name,
        "category": product.category,
        "region": rng.choice(REGIONS),
        "channel": rng.choice(CHANNELS),
        "quantity": str(quantity),
        "unit_price": format_money(unit_price),
        "total_amount": format_money(total_amount) if include_total_amount else "",
    }


def write_csv(output_path: Path, count: int, seed: int) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    rng = random.Random(seed)

    with output_path.open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=CSV_HEADERS)
        writer.writeheader()
        for index in range(1, count + 1):
            writer.writerow(build_row(index, rng))


def main() -> None:
    args = build_parser().parse_args()
    output_path = Path(args.output_path).resolve()

    if args.count <= 0:
        raise ValueError("--count must be greater than zero.")

    write_csv(output_path, args.count, args.seed)
    print("generated_count=", args.count)
    print("seed=", args.seed)
    print("output_path=", output_path)


if __name__ == "__main__":
    main()
