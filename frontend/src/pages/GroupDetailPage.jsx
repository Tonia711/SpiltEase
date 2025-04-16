import React from "react";
import { useParams } from "react-router-dom";
import styles from "../styles/GroupDetailPage.module.css";

export default function GroupDetailPage() {
  const { groupId } = useParams();

  // 🧪 模拟 group、成员、账单数据
  const mockGroup = {
    id: groupId,
    name: groupId === "1" ? "South_island Trip" : "Library_study Group",
    description:
      groupId === "1"
        ? "Budget for our trip to Queenstown"
        : "Snacks & Printing Expenses",
  };

  const members = ["Anne", "Bob", "Clara"];
  const bills = [
    { id: 1, title: "Hotel Booking", amount: 300, paidBy: "Anne" },
    { id: 2, title: "Snacks", amount: 20, paidBy: "Bob" },
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{mockGroup.name}</h2>
      <p className={styles.description}>{mockGroup.description}</p>

      <section>
        <h3>Members</h3>
        <ul className={styles.list}>
          {members.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Bills</h3>
        <ul className={styles.list}>
          {bills.map((bill) => (
            <li key={bill.id}>
              💸 <strong>{bill.title}</strong> — ${bill.amount} (Paid by{" "}
              {bill.paidBy})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
