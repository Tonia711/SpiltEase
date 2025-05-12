import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import NewBillPage from "../../pages/Bill/NewBillPage";
import { AuthContext } from "../../contexts/AuthContext";
import { BrowserRouter } from "react-router-dom";
import api from "../../utils/api";
import React from "react";

// Mock API
vi.mock("../../utils/api");

// Mock useParams + useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ groupId: "testGroup123" }),
    useNavigate: () => mockNavigate,
    BrowserRouter: actual.BrowserRouter,
  };
});

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
    { _id: "m2", userName: "Bob", isHidden: false, userId: "user456" },
  ],
};

const mockLabels = [
  { _id: "l1", type: "Food", iconUrl: "icons/food.png" },
  { _id: "l2", type: "Taxi", iconUrl: "icons/taxi.png" },
];

function setup() {
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
    vi.resetAllMocks();

    api.get.mockImplementation((url) => {
      if (url.startsWith("/groups/"))
        return Promise.resolve({ data: mockGroup });
      if (url.includes("labelsExcTrans"))
        return Promise.resolve({ data: mockLabels });
      return Promise.reject("Unknown endpoint");
    });

    api.post.mockResolvedValue({});
  });

  describe("UI Rendering", () => {
    it("renders title and note input", async () => {
      setup();
      expect(await screen.findByText("Add Expense")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("e.g. Shared taxi to airport")
      ).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("submits with minimal valid data", async () => {
      setup();

      fireEvent.change(
        await screen.findByPlaceholderText("e.g. Shared taxi to airport"),
        {
          target: { value: "Test Note" },
        }
      );

      fireEvent.change(screen.getAllByPlaceholderText("$ 0.00")[0], {
        target: { value: "100" },
      });

      fireEvent.click(screen.getByText("Add"));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledTimes(2);

        expect(api.post).toHaveBeenNthCalledWith(
          1,
          "/bills",
          expect.objectContaining({
            groupId: "testGroup123",
            note: "Test Note",
            splitWay: "Equally",
            expenses: 100,
            labelId: "l1",
            paidBy: "m1",
            members: expect.arrayContaining([
              expect.objectContaining({
                memberId: "m1",
                expense: 50,
                refund: 0,
              }),
              expect.objectContaining({
                memberId: "m2",
                expense: 50,
                refund: 0,
              }),
            ]),
          })
        );

        expect(api.post).toHaveBeenNthCalledWith(
          2,
          "/balances/group/testGroup123/recalculate"
        );
      });
    });

    it("shows validation error if required fields are missing", async () => {
      setup();
      fireEvent.click(await screen.findByText("Add"));
      expect(
        await screen.findByText("Please fill in all required fields.")
      ).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });
  });
});
