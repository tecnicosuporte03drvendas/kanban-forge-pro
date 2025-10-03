import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Phone } from 'lucide-react';
import { formatCelularForDisplay } from '@/lib/utils';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  celular: string;
  funcao_empresa: string | null;
  tipo_usuario: string;
  ativo: boolean;
}

interface ViewTeamMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: {
    id: string;
    nome: string;
    descricao: string | null;
    membros?: Usuario[];
  } | null;
}

export const ViewTeamMembersModal: React.FC<ViewTeamMembersModalProps> = ({
  open,
  onOpenChange,
  team
}) => {
  if (!team) return null;

  const getTipoUsuarioColor = (tipo: string) => {
    switch (tipo) {
      case 'proprietario':
        return 'default';
      case 'gestor':
        return 'secondary';
      case 'colaborador':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getTipoUsuarioLabel = (tipo: string) => {
    switch (tipo) {
      case 'proprietario':
        return 'Proprietário';
      case 'gestor':
        return 'Gestor';
      case 'colaborador':
        return 'Colaborador';
      default:
        return tipo;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Membros da Equipe
          </DialogTitle>
          <DialogDescription>
            {team.nome} • {team.membros?.length || 0} {(team.membros?.length || 0) === 1 ? 'membro' : 'membros'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {team.descricao && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">{team.descricao}</p>
            </div>
          )}

          {team.membros && team.membros.length > 0 ? (
            <div className="space-y-3">
              {team.membros.map((membro) => (
                <div
                  key={membro.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border bg-card ${
                    !membro.ativo ? 'opacity-50' : ''
                  }`}
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {membro.nome.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{membro.nome}</h4>
                      <Badge variant={getTipoUsuarioColor(membro.tipo_usuario)} className="text-xs">
                        {getTipoUsuarioLabel(membro.tipo_usuario)}
                      </Badge>
                      {!membro.ativo && (
                        <Badge variant="secondary" className="text-xs">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    
                    {membro.funcao_empresa && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {membro.funcao_empresa}
                      </p>
                    )}
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{membro.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{formatCelularForDisplay(membro.celular)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Esta equipe ainda não possui membros
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
