import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";
import IIITokenABI from "@/abi/IIIToken.json";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CONTRACT_ADDRESS = "0x755D14ef16592a62fFC7caE9ED6af168C295a38C";
const CANTEEN_ADDRESS = "0xd84ef4ff10cb779077f2eccbb982419e8b5107ba";

interface Transaction {
  id: string;
  reason: string;
  amount: number;
  date: string;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("Student");
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const fetchStudentData = async (account: string) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const token = new ethers.Contract(CONTRACT_ADDRESS, IIITokenABI, provider);

      const decimals = await token.decimals();

      const onChainName = await token.studentNames(account.toLowerCase());
      if (onChainName && onChainName !== "") setStudentName(onChainName);

      const bal = await token.balanceOf(account);
      setBalance(Number(ethers.formatUnits(bal, decimals)));

      // Fetch history
      const history = await token.getStudentHistory(account);
      const formatted: Transaction[] = history.map((tx: any, idx: number) => ({
        id: idx.toString(),
        reason: tx[0],
        amount: Number(tx[1]),
        date: new Date(Number(tx[2]) * 1000).toLocaleString(),
      }));
      setTransactions(formatted.reverse());
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch student data");
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (!accounts || accounts.length === 0) return;

      const account = accounts[0].toLowerCase();
      setWallet(account);
      await fetchStudentData(account);
    };

    init();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async (accounts: string[]) => {
        if (accounts.length === 0) {
          handleLogout();
        } else {
          const account = accounts[0].toLowerCase();
          setWallet(account);
          await fetchStudentData(account);
        }
      });
    }
  }, []);

  const transferToCanteen = async () => {
    if (!amount) return toast.error("Enter amount");
    try {
      setIsTransferring(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const token = new ethers.Contract(CONTRACT_ADDRESS, IIITokenABI, signer);
      const decimals = await token.decimals();
      const parsedAmount = ethers.parseUnits(amount, decimals);

      const tx = await token.transfer(CANTEEN_ADDRESS, parsedAmount);
      toast.loading("Transferring tokens...");
      await tx.wait();

      toast.success(`Transferred ${amount} IIIT$ to canteen`);
      setAmount("");
      await fetchStudentData(wallet);
    } catch (err: any) {
      console.error(err);
      toast.error(err.reason || err.message || "Transfer failed");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("wallet");
    localStorage.removeItem("userRole");
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Wallet className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">{studentName}</h1>
            <p className="text-sm text-muted-foreground">Student Dashboard</p>
          </div>
        </div>
        {wallet && (
          <Button variant="outline" className="flex items-center gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        )}
      </div>

      {!wallet ? (
        <Button onClick={() => window.ethereum.request({ method: "eth_requestAccounts" })}>
          Connect Wallet
        </Button>
      ) : (
        <>
          {/* Wallet info and transfer to canteen */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-secondary/50">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wallet Address:</p>
                <p className="text-xs font-mono break-all">{wallet}</p>
                <p className="text-sm text-muted-foreground mt-2">Balance:</p>
                <p className="text-lg font-semibold">{balance} IIIT$</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <input
                className="border p-2 rounded"
                placeholder="Amount to transfer"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button disabled={isTransferring} onClick={transferToCanteen}>
                {isTransferring ? "Transferring..." : "Transfer to Canteen"}
              </Button>
            </div>
          </Card>

          {/* Transaction History */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Transaction History</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="px-2 py-1">Amount</th>
                  <th className="px-2 py-1">Reason</th>
                  <th className="px-2 py-1">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length ? (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-secondary/20">
                      <td className="px-2 py-1">{tx.amount} IIIT$</td>
                      <td className="px-2 py-1">{tx.reason}</td>
                      <td className="px-2 py-1">{tx.date}</td>
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
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
