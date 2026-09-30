import * as React from 'react';
import { cn } from '@/lib/utils';
import { fieldClassName } from '@/components/ui/input';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => {
    return <select ref={ref} className={cn(fieldClassName, className)} {...props} />;
  },
);

Select.displayName = 'Select';

export { Select };
