import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import IIITokenABI from '@/abi/IIIToken.json';

const CONTRACT_ADDRESS = "0x755D14ef16592a62fFC7caE9ED6af168C295a38C"; 
const ADMIN_WALLET = '0xf1bd8fb4d101614aec85d852101dab48bc2e7b35';
const CANTEEN_WALLET = '0xd84ef4ff10cb779077f2eccbb982419e8b5107ba';

const Login = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  const handleWalletConnect = async () => {
    setIsConnecting(true);
    try {
      if (!window.ethereum) throw new Error('MetaMask not found');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];
      setWalletAddress(address);

      // Admin / Canteen checks
      if (address.toLowerCase() === ADMIN_WALLET.toLowerCase()) {
        localStorage.setItem('userRole', 'admin');
        toast.success('Welcome Admin!');
        navigate('/admin-dashboard');
        return;
      }

      if (address.toLowerCase() === CANTEEN_WALLET.toLowerCase()) {
        localStorage.setItem('userRole', 'canteen');
        toast.success('Welcome Canteen Staff!');
        navigate('/canteen-dashboard');
        return;
      }

      // Student check on-chain
      const token = new ethers.Contract(CONTRACT_ADDRESS, IIITokenABI, provider);
      const onChainName = await token.studentNames(address);

      if (onChainName && onChainName !== "") {
        // Already registered
        localStorage.setItem('userRole', 'student');
        localStorage.setItem('userName', onChainName);
        localStorage.setItem('wallet', address);
        toast.success(`Welcome back, ${onChainName}!`);
        navigate('/student-dashboard');
      } else {
        // Not registered, show registration form
        setShowRegistration(true);
        toast.info('Please complete your registration');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Wallet connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rollNumber) return toast.error('Fill all fields');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const token = new ethers.Contract(CONTRACT_ADDRESS, IIITokenABI, signer);

      // Call on-chain register
      const tx = await token.registerStudent(walletAddress, name);
      await tx.wait();

      localStorage.setItem('wallet', walletAddress);
      localStorage.setItem('userRole', 'student');
      localStorage.setItem('userName', name);
      localStorage.setItem('userRollNumber', rollNumber);

      toast.success('Registration successful!');
      navigate('/student-dashboard');
    } catch (err: any) {
      console.error(err);
      toast.error(err.reason || 'Registration failed');
    }
  };

  if (showRegistration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-4">Complete Registration</h1>
          <Card className="p-6">
            <form onSubmit={handleRegistration} className="space-y-4">
              <Label>Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
              <Label>Roll Number</Label>
              <Input value={rollNumber} onChange={e => setRollNumber(e.target.value)} required />
              <Label>Wallet Address</Label>
              <div className="p-2 bg-secondary/50 rounded">{walletAddress}</div>
              <Button type="submit" className="w-full">Register</Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-4">Campus Credits</h1>
        <Card className="p-6">
          <Button onClick={handleWalletConnect} disabled={isConnecting} className="w-full">
            <Wallet className="w-5 h-5 mr-2" />
            {isConnecting ? 'Connecting...' : 'Connect MetaMask Wallet'}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Login;
