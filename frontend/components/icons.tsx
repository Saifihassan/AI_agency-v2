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
  settingsSliderDesktopHorizontal,
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
  settingsSliderDesktopHorizontal,
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
