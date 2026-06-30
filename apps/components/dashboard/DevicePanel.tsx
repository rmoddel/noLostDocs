import type { DeviceRecord } from "@nolostdocs/types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type DevicePanelProps = {
  actionLoading: boolean;
  activeDeviceCount: number;
  devices: DeviceRecord[];
  devicesLoading: boolean;
  message: string | null;
  onRefreshDevices: () => void;
  onRegisterBrowser: () => void;
  onToggleDeviceLock: (deviceId: string, shouldLock: boolean) => void;
};

export function DevicePanel({
  actionLoading,
  activeDeviceCount,
  devices,
  devicesLoading,
  message,
  onRefreshDevices,
  onRegisterBrowser,
  onToggleDeviceLock
}: DevicePanelProps) {
  return (
    <Card className="side-card">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Devices</p>
          <h3>{activeDeviceCount} active sessions</h3>
        </div>
        <span className="mini-pill">Protected access</span>
      </div>
      <div className="button-row">
        <Button onClick={onRegisterBrowser} size="sm" variant="secondary">
          Register this browser
        </Button>
        <Button onClick={onRefreshDevices} size="sm" variant="secondary">
          Refresh list
        </Button>
      </div>
      {devicesLoading ? <p className="inline-feedback">Loading device and session state...</p> : null}
      <div className="device-list">
        {devices.map((device) => (
          <div className="device-card" key={device.id}>
            <div>
              <strong>{device.name}</strong>
              <p>
                {device.platform} • last seen {device.lastSeen}
              </p>
            </div>
            <div className="device-actions">
              <span className="status-pill neutral">{device.locked ? "Locked" : "Active"}</span>
              <Button
                disabled={actionLoading}
                onClick={() => onToggleDeviceLock(device.id, !device.locked)}
                size="sm"
                variant="secondary"
              >
                {device.locked ? "Restore access" : "Suspend access"}
              </Button>
            </div>
          </div>
        ))}
      </div>
      {message ? <p className="inline-feedback">{message}</p> : null}
    </Card>
  );
}
