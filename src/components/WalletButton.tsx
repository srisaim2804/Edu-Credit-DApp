import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/web3';

interface WalletButtonProps {
  address: string | null;
  onConnect: () => void;
  isConnecting?: boolean;
}

export const WalletButton = ({ address, onConnect, isConnecting }: WalletButtonProps) => {
  if (address) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg border border-border">
        <Wallet className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{shortenAddress(address)}</span>
      </div>
    );
  }

  return (
    <Button onClick={onConnect} disabled={isConnecting} className="gap-2">
      <Wallet className="w-4 h-4" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};
