import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { ProgressBar } from "@/src/components/ui/progress-bar";

export default function DashboardPage() {
  return (
    <div>
      <Card>
        <h2>Meu dia</h2>
        <ProgressBar value={65} />
        <Badge>default</Badge>
        <Badge variant="success">success</Badge>
        <Badge variant="warning">warning</Badge>
        <Button>Primário</Button>
        <Button variant="outline">Outline</Button>
      </Card>
    </div>
  );
}
