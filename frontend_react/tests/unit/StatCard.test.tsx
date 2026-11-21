import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Users } from "lucide-react";
import { StatCard } from "@/components/StatCard";

describe("StatCard", () => {
  it("muestra título y valor", () => {
    render(<StatCard title="Niños" value={42} icon={Users} />);
    expect(screen.getByText("Niños")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("muestra la tendencia positiva con signo +", () => {
    render(<StatCard title="Padrinos" value={10} icon={Users} trend={{ value: 5, isPositive: true }} />);
    expect(screen.getByText(/\+5% vs mes anterior/)).toBeInTheDocument();
  });

  it("muestra la tendencia negativa sin signo +", () => {
    render(<StatCard title="Padrinos" value={10} icon={Users} trend={{ value: -3, isPositive: false }} />);
    const el = screen.getByText(/-3% vs mes anterior/);
    expect(el.textContent).not.toContain("+");
  });

  it("no muestra tendencia si no se indica", () => {
    render(<StatCard title="Entregas" value="7" icon={Users} />);
    expect(screen.queryByText(/vs mes anterior/)).not.toBeInTheDocument();
  });
});
