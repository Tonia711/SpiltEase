import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import NewBillPage from "../../pages/Bill/NewBillPage";
import { AuthContext } from "../../contexts/AuthContext";
import { BrowserRouter } from "react-router-dom";
import api from "../../utils/api";
import React from "react";

vi.mock("../../utils/api");

const mockUser = {
  user: {
    _id: "user123",
    email: "test@example.com",
  },
  token: "mock-token",
};

const mockGroup = {
  members: [
    { _id: "m1", userName: "Alice", isHidden: false, userId: "user123" },
    { _id: "m2", userName: "Bob", isHidden: false },
  ],
};

const mockLabels = [
  { _id: "l1", type: "Food", iconUrl: "icons/food.png" },
  { _id: "l2", type: "Taxi", iconUrl: "icons/taxi.png" },
];

function renderWithProvider() {
  return render(
    <AuthContext.Provider value={mockUser}>
      <BrowserRouter>
        <NewBillPage />
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

describe("NewBillPage", () => {
  beforeEach(() => {
    api.get.mockImplementation((url) => {
      if (url.includes("/groups/")) return Promise.resolve({ data: mockGroup });
      if (url === "/bills/allLabels") return Promise.resolve({ data: mockLabels });
      return Promise.reject("Unknown endpoint");
    });

    api.post.mockResolvedValue({});
  });

  it("renders title and basic form", async () => {
    renderWithProvider();
    expect(await screen.findByText("Add Expense")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Shared taxi to airport")).toBeInTheDocument();
  });

  it("submits with minimal valid data", async () => {
    renderWithProvider();

    fireEvent.change(await screen.findByPlaceholderText("e.g. Shared taxi to airport"), {
      target: { value: "Test Note" },
    });

    fireEvent.change(screen.getAllByPlaceholderText("$ 0.00")[0], {
      target: { value: "100" },
    });

    fireEvent.click(screen.getByText("Add"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining("/bills"),
        expect.objectContaining({
          note: "Test Note",
          expenses: 100,
        })
      );
    });
  });

  it("shows validation error on empty submit", async () => {
    renderWithProvider();
    fireEvent.click(await screen.findByText("Add"));
    expect(await screen.findByText("Please fill in all required fields.")).toBeInTheDocument();
  });
});
