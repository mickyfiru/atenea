import {
  AIAssistantProvider,
  AIAssistantIntent,
  EmergencyGroupId,
  ParsedAlertCommand,
} from './types';

function normalize(text: string) {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,;:!?¿¡]/g, ' ')
    .replace(/\s+/g, ' ');
}

function cleanIncidentPlace(text: string) {
  return normalize(text)
    .replace(/\b(hay|ocurrio|ocurrio un|ocurrio una|reportar|reporte|alerta|en|un|una)\b/g, ' ')
    .replace(/\b(accidente|choque|colision|robo|asalto|incendio|fuego|humo|corte|agua|luz)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getNavigationIntent(normalized: string): AIAssistantIntent | undefined {
  if (/\b(grupos|comunidades)\b/.test(normalized)) {
    return 'open_groups';
  }

  if (/\b(mapa|ubicacion de alertas|ver cerca)\b/.test(normalized)) {
    return 'show_map';
  }

  if (/\b(llamar emergencia|llamar ambulancia|llamar policia|llamar bomberos)\b/.test(normalized)) {
    return 'call_emergency';
  }

  return undefined;
}

function buildEmergencyGroup(normalized: string): EmergencyGroupId | undefined {
  if (/\b(bombero|bomberos|incendio|fuego|humo)\b/.test(normalized)) {
    return 'default-firefighters';
  }

  if (/\b(ambulancia|herido|herida|salud|medico|medica)\b/.test(normalized)) {
    return 'default-ambulance';
  }

  if (/\b(policia|robo|asalto|sospechoso|seguridad)\b/.test(normalized)) {
    return 'default-police';
  }

  return undefined;
}

export async function parseMockAlertCommand(text: string): Promise<ParsedAlertCommand> {
  const normalized = normalize(text);

  if (!normalized) {
    return {
      intent: 'unknown',
      confidence: 0,
    };
  }

  const navigationIntent = getNavigationIntent(normalized);
  if (navigationIntent) {
    return {
      intent: navigationIntent,
      emergencyGroupId: buildEmergencyGroup(normalized),
      confidence: 0.74,
    };
  }

  if (/\b(accidente|choque|colision|transito|trafico|atropello|avenida)\b/.test(normalized)) {
    const place = cleanIncidentPlace(text) || 'avenida principal';

    return {
      intent: 'create_alert',
      category: 'Tránsito',
      title: 'Accidente vehicular',
      description: `Accidente reportado en ${place}`,
      emergencyGroupId: 'default-ambulance',
      confidence: 0.8,
    };
  }

  if (/\b(robo|asalto|sospechoso|seguridad|delito|violencia)\b/.test(normalized)) {
    return {
      intent: 'create_alert',
      category: 'Seguridad',
      title: 'Incidente de seguridad',
      description: text.trim(),
      emergencyGroupId: 'default-police',
      confidence: 0.78,
    };
  }

  if (/\b(incendio|fuego|humo|quemando|bomberos)\b/.test(normalized)) {
    return {
      intent: 'create_alert',
      category: 'Seguridad',
      title: 'Incendio reportado',
      description: text.trim(),
      emergencyGroupId: 'default-firefighters',
      confidence: 0.82,
    };
  }

  if (/\b(corte de luz|corte de agua|basura|alumbrado|servicio|servicios)\b/.test(normalized)) {
    return {
      intent: 'create_alert',
      category: 'Servicios',
      title: 'Problema de servicios',
      description: text.trim(),
      confidence: 0.72,
    };
  }

  if (/\b(vecino|vecinos|comunidad|ruido|mascota|colegio|barrio)\b/.test(normalized)) {
    return {
      intent: 'create_alert',
      category: 'Comunidad',
      title: 'Aviso comunitario',
      description: text.trim(),
      confidence: 0.68,
    };
  }

  return {
    intent: 'unknown',
    confidence: 0.25,
  };
}

export const mockProvider: AIAssistantProvider = {
  provider: 'mock',
  async sendMessage(prompt, context) {
    const parsedCommand = await parseMockAlertCommand(prompt);
    const sector = context?.sector ? ` en ${context.sector}` : '';

    if (parsedCommand.intent === 'create_alert') {
      return {
        text: `Detecte una posible alerta${sector}: ${parsedCommand.title}. Revisa la previsualizacion antes de crearla.`,
        parsedCommand,
      };
    }

    if (parsedCommand.intent === 'open_groups') {
      return {
        text: 'Puedo abrir tus grupos comunitarios.',
        parsedCommand,
      };
    }

    if (parsedCommand.intent === 'show_map') {
      return {
        text: 'Puedo abrir el mapa de alertas cercanas.',
        parsedCommand,
      };
    }

    if (parsedCommand.intent === 'call_emergency') {
      return {
        text: 'Las llamadas reales aun no estan activas. Puedo dejar preparado el flujo de emergencia.',
        parsedCommand,
      };
    }

    return {
      text: 'Todavia no entiendo bien esa instruccion. Prueba con una alerta concreta, por ejemplo: Hay un accidente en avenida principal.',
      parsedCommand,
    };
  },
  parseAlertCommand: parseMockAlertCommand,
};
