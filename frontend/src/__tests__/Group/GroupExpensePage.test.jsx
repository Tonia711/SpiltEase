import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, vi, beforeEach } from "vitest";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom";
import GroupExpensePage from "../../pages/GroupExpensePage";
import { AuthContext } from "../../contexts/AuthContext";
import api from "../../utils/api";

vi.mock("../../utils/api");

const mockUser = {
  _id: "user123",
  userName: "TestUser",
};

const mockGroup = {
  _id: "g1",
  groupName: "Mock Group",
  iconUrl: "groups/defaultIcon.jpg",
  members: [
    { _id: "m1", userId: "user123", userName: "TestUser" },
    { _id: "m2", userId: "user456", userName: "Bob" },
  ],
};

const mockBills = [
  {
    _id: "b1",
    label: { _id: "l1", iconUrl: "icons/taxi.png", type: "Taxi" },
    note: "Airport Taxi",
    expenses: 100,
    refunds: 0,
    date: "2025-05-01T00:00:00.000Z",
    members: [
      { memberId: "m1", expense: 50, refund: 0 },
      { memberId: "m2", expense: 50, refund: 0 },
    ],
  },
];

const mockBalance = {
  groupBalances: [
    {
      _id: "bal1",
      fromMemberId: "m1",
      toMemberId: "m2",
      balance: 25,
      isFinished: false,
    },
  ],
};

function renderWithContext() {
  return render(
    <AuthContext.Provider value={{ user: mockUser }}>
      <MemoryRouter initialEntries={["/groups/g1/expenses"]}>
        <Routes>
          <Route
            path="/groups/:groupId/expenses"
            element={<GroupExpensePage />}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("GroupExpensePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.get.mockImplementation((url) => {
      if (url === "/groups/g1") return Promise.resolve({ data: mockGroup });
      if (url === "/bills/group/g1")
        return Promise.resolve({ data: mockBills });
      if (url === "/balances/group/g1")
        return Promise.resolve({ data: mockBalance });
      return Promise.reject("Unknown GET");
    });

    api.post.mockResolvedValue({});
    api.put.mockResolvedValue({});
  });

  it("renders group name and expenses tab", async () => {
    renderWithContext();
    expect(await screen.findByText("Mock Group")).toBeInTheDocument();
    expect(await screen.findByText("Airport Taxi")).toBeInTheDocument();
  });

  it("switches to Balance tab and displays balance", async () => {
    renderWithContext();

    await waitFor(() => {
      expect(screen.queryByText("Loading expenses...")).not.toBeInTheDocument();
    });

    const balanceTab = screen.getByRole("button", { name: /balance/i });
    fireEvent.click(balanceTab);

    await waitFor(() => {
      expect(screen.getByText("You owe")).toBeInTheDocument();
      expect(
        screen.getByText("$25.00", { selector: "span._memberNameRight_c244b1" })
      ).toBeInTheDocument();
    });
  });

  it("shows bill amount and date", async () => {
    renderWithContext();

    await waitFor(() => {
      expect(screen.queryByText("Loading expenses...")).not.toBeInTheDocument();
    });

    expect(await screen.findByTestId("bill-amount")).toHaveTextContent(
      "$100.00"
    );
    expect(screen.getByText("May 1, 2025")).toBeInTheDocument();
  });

  it("navigates to NewBillPage when FAB clicked", async () => {
    renderWithContext();
    const fab = await screen.findByRole("button", { name: "+" });
    fireEvent.click(fab);
  });

  it("expands balance detail when clicked", async () => {
    renderWithContext();

    await waitFor(() => {
      expect(screen.queryByText("Loading expenses...")).not.toBeInTheDocument();
    });

    const balanceTab = screen.getByRole("button", { name: /balance/i });
    fireEvent.click(balanceTab);

    const balanceItem = await screen.findByText("You owe Bob");
    fireEvent.click(balanceItem);

    await waitFor(() => {
      const detailBox = screen
        .getByText("TestUser (me) owes Bob")
        .closest("div._balanceDetailBox_c244b1");
      expect(detailBox).toBeInTheDocument();
      expect(
        detailBox.querySelector("button._markPaidText_c244b1")
      ).toHaveTextContent("Mark as paid");
    });
  });
});
