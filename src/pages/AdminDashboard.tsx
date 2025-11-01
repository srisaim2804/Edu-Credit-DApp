import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";
import IIITokenABI from "@/abi/IIIToken.json";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CONTRACT_ADDRESS = "0x755D14ef16592a62fFC7caE9ED6af168C295a38C";

interface Student {
  address: string;
  name: string;
  balance: number;
  totalRewards: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [reason, setReason] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);

  const fetchStudents = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, IIITokenABI, provider);

      const studentRegisteredFilter = contract.filters.StudentRegistered();
      const studentRegisteredEvents = await contract.queryFilter(studentRegisteredFilter);

      const studentsData = await Promise.all(
        studentRegisteredEvents.map(async (event: any) => {
          const { student, name } = event.args;
          const balanceRaw = await contract.balanceOf(student);
          const totalRewardsRaw = await contract.totalRewards(student);
          const decimals = await contract.decimals();

          return {
            address: student,
            name: name,
            balance: Number(ethers.formatUnits(balanceRaw, decimals)),
            totalRewards: Number(totalRewardsRaw),
          };
        })
      );

      setStudents(studentsData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch students from blockchain.");
    }
  };

  const fetchTransactionHistory = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, IIITokenABI, provider);

      const rewardGivenFilter = contract.filters.RewardGiven();
      const rewardGivenEvents = await contract.queryFilter(rewardGivenFilter);

      const history = rewardGivenEvents.map((event: any) => {
        const { student, reason, amount } = event.args;
        return {
          student,
          reason,
          amount: Number(amount),
        };
      });

      setTransactionHistory(history.reverse());
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch transaction history.");
    }
  };

  const rewardStudent = async () => {
    if (!selectedStudent || !reason) return toast.error("Select student and reason");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, IIITokenABI, signer);

      const owner = await contract.owner();
      const currentUser = await signer.getAddress();

      if (owner.toLowerCase() !== currentUser.toLowerCase()) {
        return toast.error("Only the contract owner can reward students.");
      }

      const tx = await contract.rewardStudent(selectedStudent, reason);
      toast.loading("Rewarding student...");
      await tx.wait();
      toast.success("Reward given successfully!");
      setSelectedStudent("");
      setReason("");
      fetchStudents();
      fetchTransactionHistory();
    } catch (err: any) {
      console.error(err);
      toast.error(err.reason || err.message || "Reward failed");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate("/");
  };

  useEffect(() => {
    if (window.ethereum) {
      setWalletConnected(true);
      fetchStudents();
      fetchTransactionHistory();
    }
  }, []);

  const getRewardAmount = (reason: string) => {
    switch (reason) {
      case "attendance":
      case "event":
        return 5;
      case "sports":
        return 10;
      case "grades":
        return 15;
      default:
        return "-";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage Student Rewards</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2" onClick={handleLogout}>
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </div>

      {/* Reward Section */}
      <Card className="p-6 mb-6 shadow-lg rounded-xl bg-card">
        <h2 className="text-xl font-bold mb-4">Reward Student</h2>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <select
            className="border p-3 rounded-xl w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-primary"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="">Select Student</option>
            {students.map((s) => (
              <option key={s.address} value={s.address}>
                {s.name} ({s.address.slice(0, 6)}…)
              </option>
            ))}
          </select>

          <div className="flex gap-2 w-full md:w-1/2 items-center">
            <select
              className="border p-3 rounded-xl w-2/3 focus:outline-none focus:ring-2 focus:ring-primary"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">Select Reason</option>
              <option value="attendance">Attendance</option>
              <option value="event">Event</option>
              <option value="sports">Sports</option>
              <option value="grades">Grades</option>
            </select>
            <div className="w-1/3 text-center text-sm font-semibold bg-secondary/30 p-2 rounded-xl">
              {reason ? `${getRewardAmount(reason)} IIIT$` : "-"}
            </div>
          </div>
        </div>

        <Button onClick={rewardStudent} className="w-full mt-4">
          Reward Student
        </Button>
      </Card>

      {/* Students Overview */}
      <Card className="p-6 shadow-lg rounded-xl bg-card overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">Students Overview</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="px-2 py-1">Name</th>
              <th className="px-2 py-1">Wallet</th>
              <th className="px-2 py-1">Balance</th>
              <th className="px-2 py-1">Total Rewards</th>
            </tr>
          </thead>
          <tbody>
            {students.length ? (
              students.map((s) => (
                <tr key={s.address} className="border-b hover:bg-secondary/20">
                  <td className="px-2 py-1">{s.name}</td>
                  <td className="px-2 py-1 font-mono text-xs">{s.address}</td>
                  <td className="px-2 py-1">{s.balance} IIIT$</td>
                  <td className="px-2 py-1">{s.totalRewards}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-4 text-muted-foreground">
                  No students registered
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Transaction History */}
      <Card className="p-6 shadow-lg rounded-xl bg-card overflow-x-auto mt-6">
        <h2 className="text-xl font-bold mb-4">Transaction History</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="px-2 py-1">Student</th>
              <th className="px-2 py-1">Reason</th>
              <th className="px-2 py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactionHistory.length ? (
              transactionHistory.map((tx, i) => (
                <tr key={i} className="border-b hover:bg-secondary/20">
                  <td className="px-2 py-1">
                    {students.find((s) => s.address === tx.student)?.name || "Unknown"} (
                    {tx.student.slice(0, 6)}…)
                  </td>
                  <td className="px-2 py-1">{tx.reason}</td>
                  <td className="px-2 py-1">{tx.amount} IIIT$</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-4 text-muted-foreground">
                  No transactions yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default AdminDashboard;
