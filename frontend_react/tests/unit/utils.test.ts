import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (src/lib/utils.ts)", () => {
  it("combina clases", () => {
    expect(cn("px-2 py-1", "bg-blue-500")).toBe("px-2 py-1 bg-blue-500");
  });

  it("resuelve conflictos de Tailwind a favor de la última clase", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("ignora valores falsy", () => {
    expect(cn("btn", false && "hidden", null, undefined, "btn-primary")).toBe("btn btn-primary");
  });
});
