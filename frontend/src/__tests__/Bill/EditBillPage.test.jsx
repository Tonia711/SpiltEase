import { describe, it, vi, beforeEach, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EditBillPage from "../../pages/Bill/EditBillPage";
import api from "../../utils/api";
import React from "react";

vi.mock("../../utils/api");

const mockBillData = {
  _id: "bill123",
  labelId: "label123",
  note: "Mock Note",
  paidBy: "user123",
  expenses: 100,
  refunds: 10,
  date: "2025-05-10T00:00:00Z",
  splitWay: "Equally",
  members: [
    { memberId: "user123", expense: 50, refund: 5 },
    { memberId: "user456", expense: 50, refund: 5 },
  ],
};

const mockGroupData = {
  members: [
    { _id: "user123", userName: "Alice", isHidden: false },
    { _id: "user456", userName: "Bob", isHidden: false },
  ],
};

const mockLabels = [
  { _id: "label123", type: "Food", iconUrl: "food.png" },
  { _id: "label456", type: "Taxi", iconUrl: "taxi.png" },
];

function renderWithRoutes() {
  return render(
    <MemoryRouter initialEntries={["/groups/group123/edit/bill123"]}>
      <Routes>
        <Route path="/groups/:groupId/edit/:billId" element={<EditBillPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("EditBillPage", () => {
  beforeEach(() => {
    api.get.mockImplementation((url) => {
      if (url.includes("/groups/")) return Promise.resolve({ data: mockGroupData });
      if (url.includes("/bills/group123/bill/bill123")) return Promise.resolve({ data: mockBillData });
      if (url === "/bills/allLabels") return Promise.resolve({ data: mockLabels });
      return Promise.reject("Unknown API GET");
    });

    api.put.mockResolvedValue({ data: {} });
    api.post.mockResolvedValue({ data: {} });
  });

  it("renders basic form data", async () => {
    renderWithRoutes();
    expect(await screen.findByText("Edit Expense")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Mock Note")).toBeInTheDocument();
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
  });

  it("shows validation error on incomplete submit", async () => {
    renderWithRoutes();
    await screen.findByDisplayValue("Mock Note");
  
    const inputs = screen.getAllByPlaceholderText("$ 0.00");
    fireEvent.change(inputs[0], { target: { value: "" } }); // 清空 Paid Amount
  
    fireEvent.click(screen.getByText("Save"));
  
    expect(await screen.findByText("Please fill in all required fields.")).toBeInTheDocument();
  });
  

  it("submits updated bill successfully", async () => {
    renderWithRoutes();
    await screen.findByDisplayValue("Mock Note");

    fireEvent.change(screen.getByPlaceholderText("e.g. Shared taxi to airport"), {
      target: { value: "Updated Note" },
    });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        "/bills/group123/bill/bill123",
        expect.objectContaining({
          note: "Updated Note",
          splitWay: "Equally",
        })
      );
    });
  });
});
