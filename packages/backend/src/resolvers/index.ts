import { authResolvers } from './auth.resolvers';
import { usuarioResolvers } from './usuario.resolvers';
import { familiaResolvers } from './familia.resolvers';
import { miembroResolvers } from './miembro.resolvers';
import { visitaResolvers } from './visita.resolvers';
import { metaResolvers } from './meta.resolvers';
import { barrioResolvers } from './barrio.resolvers';
import { nucleoResolvers } from './nucleo.resolvers';
import { utilsResolvers } from './utils.resolvers';
import { timelineResolvers } from './timeline.resolvers';

export const resolvers: any = {
  Query: {
    ...usuarioResolvers.Query,
    ...familiaResolvers.Query,
    ...miembroResolvers.Query,
    ...visitaResolvers.Query,
    ...metaResolvers.Query,
    ...barrioResolvers.Query,
    ...nucleoResolvers.Query,
    ...timelineResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...usuarioResolvers.Mutation,
    ...familiaResolvers.Mutation,
    ...miembroResolvers.Mutation,
    ...visitaResolvers.Mutation,
    ...metaResolvers.Mutation,
    ...barrioResolvers.Mutation,
    ...nucleoResolvers.Mutation,
    ...utilsResolvers.Mutation,
  },
  Usuario: usuarioResolvers.Usuario,
  Familia: familiaResolvers.Familia,
  Miembro: miembroResolvers.Miembro,
  Visita: visitaResolvers.Visita,
  Meta: metaResolvers.Meta,
  Nucleo: nucleoResolvers.Nucleo,
};
