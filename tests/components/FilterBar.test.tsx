import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterBar, DEFAULT_FILTERS } from "@/components/FilterBar";

describe("FilterBar", () => {
  it("calls onChange with updated search text", () => {
    const onChange = vi.fn();
    render(<FilterBar filters={DEFAULT_FILTERS} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/search grant/i);
    fireEvent.change(input, { target: { value: "women founder" } });

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, search: "women founder" });
  });

  it("toggles the country filter when a pill is clicked", () => {
    const onChange = vi.fn();
    render(<FilterBar filters={DEFAULT_FILTERS} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Canada" }));
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, country: "Canada" });
  });

  it("only shows the clear-filters button when a filter is active", () => {
    const onChange = vi.fn();
    const { rerender } = render(<FilterBar filters={DEFAULT_FILTERS} onChange={onChange} />);
    expect(screen.queryByText(/clear filters/i)).not.toBeInTheDocument();

    rerender(<FilterBar filters={{ ...DEFAULT_FILTERS, country: "Canada" }} onChange={onChange} />);
    expect(screen.getByText(/clear filters/i)).toBeInTheDocument();
  });
});
