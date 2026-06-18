import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const DEFAULT_VOICE = "es_ES-davefx-medium";
const DEFAULT_DATA_DIR = "data/piper-voices";
const DEFAULT_LENGTH_SCALE = 1.05;
const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_TEXT_LENGTH = 1200;

export class PiperError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 503,
    public readonly details?: string,
  ) {
    super(message);
    this.name = "PiperError";
  }
}

type PiperConfig = {
  baseUrl: string | null;
  dataDir: string;
  lengthScale: number;
  python: string;
  timeoutMs: number;
  voice: string;
};

function normalizeBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/\/+$/, "");
}

function numberFromEnv(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getDefaultPython(): string {
  const executable = process.platform === "win32" ? "python.exe" : "python";
  const localPython = path.join(process.cwd(), ".venv-piper", "bin", executable);
  return existsSync(localPython) ? localPython : "python3";
}

function getPiperConfig(): PiperConfig {
  return {
    baseUrl: normalizeBaseUrl(process.env.PIPER_BASE_URL),
    dataDir: process.env.PIPER_DATA_DIR?.trim() || DEFAULT_DATA_DIR,
    lengthScale: numberFromEnv(
      process.env.PIPER_LENGTH_SCALE,
      DEFAULT_LENGTH_SCALE,
    ),
    python: process.env.PIPER_PYTHON?.trim() || getDefaultPython(),
    timeoutMs: numberFromEnv(process.env.PIPER_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    voice: process.env.PIPER_VOICE?.trim() || DEFAULT_VOICE,
  };
}

export function normalizePiperText(text: unknown): string {
  if (typeof text !== "string") {
    throw new PiperError("Text is required.", 400);
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    throw new PiperError("Text is required.", 400);
  }
  if (normalized.length > MAX_TEXT_LENGTH) {
    throw new PiperError(
      `Text must be ${MAX_TEXT_LENGTH} characters or less.`,
      413,
    );
  }

  return normalized;
}

async function synthesizeViaHttp(
  text: string,
  config: PiperConfig,
): Promise<Buffer> {
  if (!config.baseUrl) {
    throw new PiperError("Piper HTTP server is not configured.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}/synthesize`, {
      body: JSON.stringify({
        length_scale: config.lengthScale,
        text,
        voice: config.voice,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    });

    if (!response.ok) {
      const details = await response.text();
      throw new PiperError(
        `Piper HTTP server returned ${response.status}.`,
        502,
        details,
      );
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    if (error instanceof PiperError) {
      throw error;
    }
    throw new PiperError(
      "Could not synthesize speech with the Piper HTTP server.",
      503,
      error instanceof Error ? error.message : undefined,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

async function synthesizeViaCli(
  text: string,
  config: PiperConfig,
): Promise<Buffer> {
  const tempDir = await mkdtemp(path.join(tmpdir(), "oye-piper-"));
  const outputPath = path.join(tempDir, "speech.wav");

  try {
    await execFileAsync(
      config.python,
      [
        "-m",
        "piper",
        "-m",
        config.voice,
        "--data-dir",
        config.dataDir,
        "--length-scale",
        String(config.lengthScale),
        "-f",
        outputPath,
        "--",
        text,
      ],
      {
        maxBuffer: 1024 * 1024,
        timeout: config.timeoutMs,
      },
    );

    return await readFile(outputPath);
  } catch (error) {
    const details = error instanceof Error ? error.message : undefined;
    throw new PiperError(
      "Could not synthesize speech with Piper. Make sure Piper is installed and the configured voice has been downloaded.",
      503,
      details,
    );
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}

export async function synthesizePiperSpeech(text: string): Promise<Buffer> {
  const config = getPiperConfig();
  if (config.baseUrl) {
    return synthesizeViaHttp(text, config);
  }
  return synthesizeViaCli(text, config);
}
