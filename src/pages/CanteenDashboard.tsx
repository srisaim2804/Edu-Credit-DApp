import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import IIITokenABI from '@/abi/IIIToken.json';
import { DollarSign, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const CONTRACT_ADDRESS = "0x755D14ef16592a62fFC7caE9ED6af168C295a38C";
const CANTEEN_ADDRESS = "0xd84ef4ff10cb779077f2eccbb982419e8b5107ba";

const CanteenDashboard = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        toast.error("Metamask not detected. Please install Metamask.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, IIITokenABI, provider);

      await fetchCanteenBalance(contractInstance);
      await fetchTransactionHistory(contractInstance, provider);
    };

    init();
  }, []);

  const fetchCanteenBalance = async (contract: ethers.Contract) => {
    try {
      const balance = await contract.balanceOf(CANTEEN_ADDRESS);
      const decimals = await contract.decimals();
      setBalance(Number(ethers.formatUnits(balance, decimals)));
    } catch (error) {
      console.error("Failed to fetch canteen balance:", error);
      toast.error("Failed to fetch canteen balance.");
    }
  };

  const fetchTransactionHistory = async (contract: ethers.Contract, provider: ethers.Provider) => {
    try {
      const transferFilter = contract.filters.Transfer(null, CANTEEN_ADDRESS);
      const transferEvents = await contract.queryFilter(transferFilter);

      const history = await Promise.all(
        transferEvents.map(async (event: any) => {
          const { from, value } = event.args;
          const studentName = await contract.studentNames(from.toLowerCase());
          return {
            student: from,
            studentName: studentName || "Unknown",
            amount: Number(ethers.formatUnits(value, await contract.decimals())),
          };
        })
      );

      setTransactions(history.reverse());
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch transaction history.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Canteen Dashboard</h1>
            <p className="text-sm text-muted-foreground">Your collected Campus Credits</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleLogout} className="gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      {/* Balance Card */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-xl bg-secondary/50">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Wallet Address:</p>
            <p className="text-xs font-mono break-all">{CANTEEN_ADDRESS}</p>
            <p className="text-sm text-muted-foreground mt-2">Balance:</p>
            <p className="text-lg font-semibold">{balance} IIIT$</p>
          </div>
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="p-6 shadow-lg rounded-xl bg-card overflow-x-auto mt-6">
        <h2 className="text-xl font-bold mb-4">Transaction History</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="px-2 py-1">Student</th>
              <th className="px-2 py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length ? (
              transactions.map((tx, i) => (
                <tr key={i} className="border-b hover:bg-secondary/20">
                  <td className="px-2 py-1">
                    {tx.studentName} ({tx.student.slice(0, 6)}…)
                  </td>
                  <td className="px-2 py-1">{tx.amount} IIIT$</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="text-center py-4 text-muted-foreground">
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

export default CanteenDashboard;