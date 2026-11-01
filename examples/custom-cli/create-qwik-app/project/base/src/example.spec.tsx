import { component$ } from "@builder.io/qwik";
import { describe, expect, test } from "vitest";
import { render, screen } from "@noma.to/qwik-testing-library";

const Hello = component$(() => <div>Hello Qwik</div>);

describe("Hello", () => {
  test("renders", async () => {
    await render(<Hello />);
    expect(screen.getByText("Hello Qwik")).toBeDefined();
  });
});
