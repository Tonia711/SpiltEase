import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import BillDetailPage from "../../pages/Bill/BillDetailPage";
import api from "../../utils/api";

vi.mock("../../utils/api");

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ groupId: "g1", billId: "b1" }),
    useNavigate: () => vi.fn(),
  };
});

const mockLabels = [{ _id: "label1", type: "Food", iconUrl: "food.png" }];

const mockBill = {
  _id: "b1",
  labelId: "label1",
  note: "Lunch at cafe",
  paidByName: "Alice",
  expenses: 50,
  refunds: 20,
  date: "2024-01-01",
  members: [
    { userName: "Alice", expense: 25, refund: 5 },
    { userName: "Bob", expense: 25, refund: 15 },
  ],
};

describe("BillDetailPage", () => {
  beforeEach(() => {
    api.get.mockImplementation((url) => {
      if (url === "/bills/allLabels")
        return Promise.resolve({ data: mockLabels });
      if (url === "/bills/g1/bill/b1")
        return Promise.resolve({ data: mockBill });
      return Promise.reject("Unknown GET");
    });
  });

  it("renders bill details", async () => {
    render(
      <BrowserRouter>
        <BillDetailPage />
      </BrowserRouter>
    );

    expect(await screen.findByText("Lunch at cafe")).toBeInTheDocument();
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getByText("$50.00")).toBeInTheDocument();
    expect(screen.getByText("Refund")).toBeInTheDocument();
    expect(screen.getByText("2024-01-01")).toBeInTheDocument();
  });

  it("shows confirmation on delete click", async () => {
    render(
      <BrowserRouter>
        <BillDetailPage />
      </BrowserRouter>
    );

    const deleteButton = await screen.findByText("Delete");
    fireEvent.click(deleteButton);

    expect(
      screen.getByText("Are you sure you want to delete this expense?")
    ).toBeInTheDocument();
  });
});
