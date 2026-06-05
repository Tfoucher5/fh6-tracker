import { createClient } from "npm:@supabase/supabase-js@2";

type CarInput = {
  source_key: string;
  make: string;
  model: string;
  year: number | null;
  car_type: string | null;
  car_class: string | null;
  pi: number | null;
  country: string | null;
  availability: string | null;
  dlc: string | null;
  source_url: string;
  source_updated_at: string;
};

const FORZA_CARS_URL = "https://forza.net/fh6cars";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function makeSourceKey(car: {
  year: number | null;
  make: string;
  model: string;
}) {
  return slugify(`${car.year ?? "unknown"}-${car.make}-${car.model}`);
}

function parseYearAndModel(carName: string) {
  const clean = carName.trim();

  const yearMatch = clean.match(/^(\d{4})\s+(.+)$/);

  if (!yearMatch) {
    return {
      year: null,
      model: clean,
    };
  }

  return {
    year: Number(yearMatch[1]),
    model: yearMatch[2].trim(),
  };
}

function normalizeClassAndPi(value: string | null | undefined) {
  if (!value) {
    return {
      car_class: null,
      pi: null,
    };
  }

  const clean = String(value).trim();

  // Exemples possibles :
  // "100 D"
  // "D 100"
  // "S1 734"
  // "734 S1"
  const matchA = clean.match(/^(\d{1,3})\s*([A-Z0-9]{1,2})$/i);
  const matchB = clean.match(/^([A-Z0-9]{1,2})\s*(\d{1,3})$/i);

  if (matchA) {
    return {
      pi: Number(matchA[1]),
      car_class: matchA[2].toUpperCase(),
    };
  }

  if (matchB) {
    return {
      car_class: matchB[1].toUpperCase(),
      pi: Number(matchB[2]),
    };
  }

  return {
    car_class: clean.toUpperCase(),
    pi: null,
  };
}

function stripMakePrefix(make: string, model: string): string {
  if (model.toLowerCase().startsWith(make.toLowerCase() + " ")) {
    return model.slice(make.length + 1).trim();
  }
  return model;
}

function normalizeCarFromObject(obj: Record<string, unknown>): CarInput | null {
  const keys = Object.keys(obj);

  function pick(possibleKeys: string[]) {
    const foundKey = keys.find((k) =>
      possibleKeys.some((p) => k.toLowerCase().replace(/\s|_|-/g, "") === p)
    );

    if (!foundKey) return null;

    const value = obj[foundKey];

    if (value === null || value === undefined) return null;

    return String(value).trim();
  }

  const make = pick(["make", "manufacturer"]);
  const carName =
    pick(["carname", "name", "model", "vehicle", "car"]) ?? "";

  if (!make || !carName) {
    return null;
  }

  const { year, model: rawModel } = parseYearAndModel(carName);
  const model = stripMakePrefix(make, rawModel);

  const carType = pick(["cartype", "type", "category"]);
  const classRaw = pick(["carclass", "class", "pi"]);
  const { car_class, pi } = normalizeClassAndPi(classRaw);

  const country = pick(["country", "origin"]);
  const availability = pick(["collection", "availability", "source"]);
  const dlc = pick(["addons", "addon", "add_ons", "dlc"]);

  const normalized = {
    year,
    make,
    model,
  };

  return {
    source_key: makeSourceKey(normalized),
    make,
    model,
    year,
    car_type: carType,
    car_class,
    pi,
    country,
    availability,
    dlc,
    source_url: FORZA_CARS_URL,
    source_updated_at: new Date().toISOString(),
  };
}

function walkJsonForCars(value: unknown, found: CarInput[]) {
  if (Array.isArray(value)) {
    for (const item of value) {
      walkJsonForCars(item, found);
    }

    return;
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;

    const car = normalizeCarFromObject(obj);

    if (car) {
      found.push(car);
    }

    for (const child of Object.values(obj)) {
      walkJsonForCars(child, found);
    }
  }
}

function extractPayloadUrl(html: string) {
  const payloadMatch = html.match(/["']([^"']*_payload\.json\?[^"']+)["']/i);

  if (!payloadMatch) {
    return null;
  }

  const raw = payloadMatch[1];

  if (raw.startsWith("http")) {
    return raw;
  }

  return new URL(raw, FORZA_CARS_URL).toString();
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractCarsFromHtmlTable(html: string) {
  const cars: CarInput[] = [];

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;

  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(html))) {
    const rowHtml = rowMatch[1];

    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellRegex.exec(rowHtml))) {
      cells.push(stripHtml(cellMatch[1]));
    }

    // Colonnes attendues :
    // Make | Car Name | Car Type | Car Class | Country | Collection | Add-Ons
    if (cells.length < 6) continue;

    const [make, carName, carType, classRaw, country, collection, addons] = cells;

    if (!make || !carName || make.toLowerCase() === "make") continue;

    const { year, model: rawModel } = parseYearAndModel(carName);
    const model = stripMakePrefix(make, rawModel);
    const { car_class, pi } = normalizeClassAndPi(classRaw);

    cars.push({
      source_key: makeSourceKey({ year, make, model }),
      make,
      model,
      year,
      car_type: carType || null,
      car_class,
      pi,
      country: country || null,
      availability: collection || null,
      dlc: addons || null,
      source_url: FORZA_CARS_URL,
      source_updated_at: new Date().toISOString(),
    });
  }

  return cars;
}

function uniqueCars(cars: CarInput[]) {
  const map = new Map<string, CarInput>();

  for (const car of cars) {
    map.set(car.source_key, car);
  }

  return Array.from(map.values());
}

async function scrapeCars() {
  const htmlResponse = await fetch(FORZA_CARS_URL, {
    headers: {
      "user-agent": "fh6-tracker/1.0 (+personal garage tracker)",
      "accept": "text/html,application/xhtml+xml",
    },
  });

  if (!htmlResponse.ok) {
    throw new Error(`Forza HTML fetch failed: ${htmlResponse.status}`);
  }

  const html = await htmlResponse.text();

  const carsFromHtml = extractCarsFromHtmlTable(html);

  if (carsFromHtml.length > 100) {
    return uniqueCars(carsFromHtml);
  }

  const payloadUrl = extractPayloadUrl(html);

  if (payloadUrl) {
    const payloadResponse = await fetch(payloadUrl, {
      headers: {
        "user-agent": "fh6-tracker/1.0 (+personal garage tracker)",
        "accept": "application/json",
      },
    });

    if (payloadResponse.ok) {
      const json = await payloadResponse.json();

      const found: CarInput[] = [];
      walkJsonForCars(json, found);

      const carsFromPayload = uniqueCars(found);

      if (carsFromPayload.length > 100) {
        return carsFromPayload;
      }
    }
  }

  // Dernier fallback avec l'URL payload fournie manuellement
  const manualPayloadUrl = Deno.env.get("FORZA_PAYLOAD_URL");

  if (manualPayloadUrl) {
    const payloadResponse = await fetch(manualPayloadUrl, {
      headers: {
        "user-agent": "fh6-tracker/1.0 (+personal garage tracker)",
        "accept": "application/json",
      },
    });

    if (payloadResponse.ok) {
      const json = await payloadResponse.json();

      const found: CarInput[] = [];
      walkJsonForCars(json, found);

      const carsFromManualPayload = uniqueCars(found);

      if (carsFromManualPayload.length > 100) {
        return carsFromManualPayload;
      }
    }
  }

  throw new Error("No usable car list found from HTML or payload.");
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      {
        ok: false,
        error: "Missing Supabase env vars.",
      },
      {
        status: 500,
      }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const sourceUrl = FORZA_CARS_URL;

  const { data: run, error: runError } = await supabase
    .from("scrape_runs")
    .insert({
      source_url: sourceUrl,
      status: "running",
    })
    .select("id")
    .single();

  if (runError) {
    return Response.json(
      {
        ok: false,
        error: runError.message,
      },
      {
        status: 500,
      }
    );
  }

  try {
    const cars = await scrapeCars();

    let inserted = 0;
    let updated = 0;

    for (const car of cars) {
      const { data: existing } = await supabase
        .from("cars")
        .select("id")
        .eq("source_key", car.source_key)
        .maybeSingle();

      const { error } = await supabase
        .from("cars")
        .upsert(car, {
          onConflict: "source_key",
        });

      if (error) {
        throw error;
      }

      if (existing) {
        updated++;
      } else {
        inserted++;
      }
    }

    await supabase
      .from("scrape_runs")
      .update({
        status: "success",
        cars_found: cars.length,
        cars_inserted: inserted,
        cars_updated: updated,
        finished_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    return Response.json({
      ok: true,
      cars_found: cars.length,
      inserted,
      updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await supabase
      .from("scrape_runs")
      .update({
        status: "error",
        error_message: message,
        finished_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    return Response.json(
      {
        ok: false,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
});