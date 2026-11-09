import { Icon } from "@iconify/react";
import {
  layoutDashboard1,
  pencil1,
  networkSearch,
  newspaperFold,
  sendEmailFly,
  dataTransferDiagonal1,
  plusOneIncrement,
  ideaStrategy,
  timeClockCircle,
  businessCard1,
} from "@stacksjs/iconify-streamline-ultimate";

export {
  layoutDashboard1,
  pencil1,
  networkSearch,
  newspaperFold,
  sendEmailFly,
  dataTransferDiagonal1,
  plusOneIncrement,
  ideaStrategy,
  timeClockCircle,
  businessCard1,
};

export type StreamlineIcon = typeof layoutDashboard1;

export function Streamline({
  icon,
  size = 17,
  className,
}: {
  icon: StreamlineIcon;
  size?: number;
  className?: string;
}) {
  return (
    <Icon
      icon={icon}
      fontSize={size}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    />
  );
}
