import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  showThemeToggle?: boolean;
}

export function Header({ title, showBack = false, onBack, rightContent, showThemeToggle = true }: HeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {showThemeToggle && <ThemeToggle />}
          {rightContent}
        </div>
      </div>
    </header>
  );
}
