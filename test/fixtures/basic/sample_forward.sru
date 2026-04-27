forward
global type util_uo_permisos from nonvisualobject
end type
end forward

global type util_uo_permisos from nonvisualobject
end type
global util_uo_permisos util_uo_permisos

type variables
// Datastore donde estan las empresas a las que el  usuario tiene permisos
uo_ds ids_empresas_permisos
uo_ds ids_centros_permisos

Private:
Boolean ib_inicializado

// Datastore donde estan los permisos de la tabla GE.PERMISOS
uo_ds ids_permisos
uo_ds ids_permisos_completos

// Datastore donde estan los permisos de la tabla GE.PERMISOS_SOL
uo_ds ids_permisos_sol

// Datastore donde estan los permisos de la vista GE.V_PERMISOS que son especificos por centro
uo_ds ids_permisos_ambito_centro

end variables

forward prototypes
public function boolean uf_permiso_obu(string as_usuario,long al_centro,long al_permiso)
public function boolean uf_permiso_obu(long al_centro,long al_permiso)
public function boolean uf_permiso_obu(long al_permiso)
public function integer uf_dame_centros_permiso_imu(integer ai_elemento,long al_empresa,ref long al_centros[])
public function integer uf_dame_empresas_permiso_imu(integer ai_elemento,ref long al_empresa[])
public function boolean uf_permiso_ceu(long al_centro,string as_usuario)
public function boolean uf_permiso_ceu(long al_centro)
public function boolean uf_inicializar ()
public function boolean uf_comprueba_inicializacion()
private function boolean _uf_permiso_sol(string as_usuario,long al_centro,string as_c_codigo,string as_tp_permiso)
public function boolean uf_permiso_sol(string as_usuario,long al_centro,string as_c_codigo)
public function boolean uf_permiso_sol(string as_c_codigo)
public function boolean uf_permiso_sol(long al_centro,string as_c_codigo)
public function boolean uf_permiso_ser(string as_usuario,long al_centro,string as_c_codigo)
public function boolean uf_permiso_ser(long al_centro,string as_c_codigo)
public subroutine uf_destruir_ds()
public function uo_ds uf_dame_empresas_filtradas(string as_filtro)
public function uo_ds uf_dame_centros_filtrados (string as_filtro)
public function uo_ds uf_dame_permisos_filtrados(string as_filtro)
public function string uf_permiso_imu(string as_usuario,long al_centro,long al_permiso)
public function string uf_permiso_elemento_menu(string as_usuario,long al_centro,string as_classname)
private function string _uf_permiso(string as_usuario,long al_centro,long al_permiso,string as_tp_permiso,string as_classname)
end prototypes

public function boolean uf_permiso_obu(string as_usuario,long al_centro,long al_permiso);
if _uf_permiso(as_usuario,al_centro,al_permiso,'OBU','')= 'SI' then
	RETURN true
else
	return false
end if
end function

public function boolean uf_permiso_obu(long al_centro,long al_permiso);RETURN uf_permiso_obu(gstr_user.c_usuario,al_centro,al_permiso)
end function

public function boolean uf_permiso_obu(long al_permiso);RETURN uf_permiso_obu(gstr_user.c_usuario,gstr_user.c_centro_sel,al_permiso)
end function

public function integer uf_dame_centros_permiso_imu(integer ai_elemento,long al_empresa,ref long al_centros[]);ent_uo_centros  lent_uo_centros
ent_st_error lent_st_error
uo_ds lds_centros
long ll_null[]
long ll_fila
long ll_total_filas

al_centros = ll_null

FOR ll_fila = 1 TO UpperBound(gl_centros_per)
	ll_total_filas = UpperBound(gl_centros_per)
	al_centros[ll_fila] = gl_centros_per[ll_fila]
NEXT
	
destroy lds_centros

if ll_total_filas =  0 then 
	RETURN 0
else
	RETURN 1
end if

end function

public function integer uf_dame_empresas_permiso_imu(integer ai_elemento,ref long al_empresa[]);ent_uo_empresas  lent_uo_empresas
ent_st_error lent_st_error
uo_ds lds_empresas
long ll_null[]
long ll_fila
long ll_total_filas

al_empresa = ll_null

lds_empresas = lent_uo_empresas.uf_listar_por_permisos(This,lds_empresas,"IMU",ai_elemento, lent_st_error)    

IF lent_st_error.codigo = -1 THEN
		destroy lds_empresas
		RETURN -1
END IF

ll_total_filas = lds_empresas.RowCount()
		
FOR ll_fila = 1  TO ll_total_filas
	al_empresa[ll_fila] = lds_empresas.object.c_empresa[ll_fila]
NEXT 
	
destroy lds_empresas

if ll_total_filas =  0 then 
	RETURN 0
else
	RETURN 1
end if

end function

public function boolean uf_permiso_ceu(long al_centro,string as_usuario);
if _uf_permiso(as_usuario,al_centro,al_centro,'CEU','')= 'SI' then
	RETURN true
else
	return false
end if 
end function

public function boolean uf_permiso_ceu(long al_centro);RETURN uf_permiso_ceu(al_centro,gstr_user.c_usuario)
end function

public function boolean uf_inicializar ();ent_st_error lst_error
ent_uo_permisos luo_permisos
ent_uo_permisos_sol luo_permisos_sol
ent_uo_v_permisos luo_v_permisos
ent_uo_empresas luo_empresas
ent_uo_centros luo_centros
ent_uo_rel_grupo_usuario lent_uo_rel_grupo_usuario

// Si la dw es valida la destruimos primero
IF IsValid ( ids_permisos ) THEN
	DESTROY ids_permisos
END IF

IF IsValid ( ids_permisos_sol ) THEN
	DESTROY ids_permisos_sol
END IF

IF IsValid ( ids_permisos_completos ) THEN
	DESTROY ids_permisos_completos
END IF

IF IsValid ( ids_permisos_ambito_centro ) THEN
	DESTROY ids_permisos_ambito_centro
END IF

IF IsValid ( ids_empresas_permisos ) THEN
	DESTROY ids_empresas_permisos
END IF

IF IsValid ( ids_empresas_permisos ) THEN
	DESTROY ids_empresas_permisos
END IF

IF IsValid ( ids_centros_permisos ) THEN
	DESTROY ids_centros_permisos
END IF

// Obtenemos todos los permisos del usuario,de los centros permitidos y los tipos CEU y OBU(Tabla GE.PERMISOS)
ids_permisos_completos = luo_permisos.uf_listar_por_usuario ( This, ids_permisos_completos, gstr_user.c_usuario, lst_error )
IF lst_error.codigo = enum_error.FALLO THEN
	RETURN False
END IF

// Obtenemos todos los permisos que tienen ámbito por centro
ids_permisos_ambito_centro = luo_v_permisos.uf_listar_por_ambito(This,ids_permisos_ambito_centro,'C',lst_error)
IF lst_error.codigo = enum_error.FALLO THEN
	RETURN False
END IF

// Obtenemos todas las empresas a las que tiene permiso el usuario
ids_empresas_permisos = luo_empresas.uf_listar_por_permisos ( This, ids_empresas_permisos, lst_error )
IF lst_error.codigo = enum_error.FALLO THEN
	RETURN False
END IF

// Obtenemos todas las empresas a las que tiene permiso el usuario
ids_centros_permisos = luo_centros.uf_listar_por_permisos ( This, ids_centros_permisos, lst_error )
IF lst_error.codigo = enum_error.FALLO THEN
	RETURN False
END IF

// Obtenemos todos los permisos del usuario,de los centros permitidos y los tipos SER y SOL(Tabla GE.PERMISOS_SOL)
IF UpperBound ( gstr_user.c_centros_per [ ] ) > 0 THEN
	ids_permisos_sol = luo_permisos_sol.uf_listar_por_centros_usuario ( This, ids_permisos_sol, gstr_user.c_centros_per [ ], gstr_user.c_usuario, lst_error )
	IF lst_error.codigo = enum_error.FALLO THEN
		RETURN False
	END IF
END IF

ib_inicializado = True

RETURN True
end function

public function boolean uf_comprueba_inicializacion();RETURN NOT ib_inicializado
end function

private function boolean _uf_permiso_sol(string as_usuario,long al_centro,string as_c_codigo,string as_tp_permiso);// Consultamos los PERMISOS en la DS ids_permisos
Long ll_fila
Long ll_centro
String ls_filtro
ent_uo_permisos_sol  lent_uo_permisos_sol
ent_st_error lent_st_error
ent_st_permisos_sol lent_st_permisos_sol

// Si no está inicializado lo buscamos en BBDD
// ya que antes de logear realiza una consulta de permisos con centro 0
IF NOT ib_inicializado THEN
	lent_st_permisos_sol = lent_uo_permisos_sol.uf_cargar_por_pk(This, as_usuario,al_centro,399,as_tp_permiso,as_c_codigo, lent_st_error,lent_uo_permisos_sol.SELECT_0_1_REGISTROS)            
	CHOOSE CASE lent_st_error.codigo
		CASE -1,100
			RETURN False
	END CHOOSE
	RETURN(lent_st_permisos_sol.tp_acceso = 'S')
END IF

//APG: de momento los permisos SER siguen por centro
if as_tp_permiso = 'SOL' then

	//APG: Si es un permiso que tiene ámbito por centro se busca si tiene permiso para ese centro concreto,si no,para el centro defecto
	ls_filtro =  "c_permiso = '" + as_c_codigo + "' AND tp_permiso = '" + as_tp_permiso +  "'"
	ll_fila = ids_permisos_ambito_centro.Find(ls_filtro,1,ids_permisos_ambito_centro.RowCount())
	IF ll_fila > 0 THEN
		ll_centro = al_centro
	ELSE
		ll_centro = gstr_user.c_centro_def
	END IF
	
	ls_filtro =  "c_centro=" + String(ll_centro)+ "  AND c_codigo = '" + as_c_codigo + "'" + " AND tp_permiso = '" + as_tp_permiso + "'"
	ll_fila = ids_permisos_sol.Find(ls_filtro,1,ids_permisos_sol.RowCount())
	IF ll_fila > 0 THEN
		RETURN(ids_permisos_sol.GetItemString(ll_fila,'tp_acceso') = 'S')
	ELSE
		RETURN False
	END IF

else
	ls_filtro =  "c_grupo = '" + as_usuario + "' AND c_centro=" + String(al_centro)+ " AND c_elemento = 399 AND tp_permiso = '" + as_tp_permiso + "' AND c_codigo = '" + as_c_codigo + "'"

	ll_fila = ids_permisos_sol.Find(ls_filtro,1,ids_permisos_sol.RowCount())
	IF ll_fila > 0 THEN
		RETURN(ids_permisos_sol.GetItemString(ll_fila,'tp_acceso') = 'S')
	ELSE
		RETURN False
	END IF
end if
end function

public function boolean uf_permiso_sol(string as_usuario,long al_centro,string as_c_codigo);RETURN _uf_permiso_sol(as_usuario,al_centro,as_c_codigo,'SOL')
end function

public function boolean uf_permiso_sol(string as_c_codigo);RETURN uf_permiso_sol(gstr_user.c_usuario,gstr_user.c_centro_sel,as_c_codigo)
end function

public function boolean uf_permiso_sol(long al_centro,string as_c_codigo);RETURN uf_permiso_sol(gstr_user.c_usuario,al_centro,as_c_codigo)
end function

public function boolean uf_permiso_ser(string as_usuario,long al_centro,string as_c_codigo);RETURN _uf_permiso_sol(as_usuario,al_centro,as_c_codigo,'SER')
end function

public function boolean uf_permiso_ser(long al_centro,string as_c_codigo);RETURN uf_permiso_ser(gstr_user.c_usuario,al_centro,as_c_codigo)
end function

public subroutine uf_destruir_ds();
end subroutine

public function uo_ds uf_dame_empresas_filtradas(string as_filtro);uo_ds lds_empresas

lds_empresas=create uo_ds
lds_empresas.dataobject=guo_permisos.ids_empresas_permisos.dataobject
lds_empresas.settransobject(LOCAL)

guo_permisos.ids_empresas_permisos.setfilter(as_filtro)
guo_permisos.ids_empresas_permisos.filter()

if guo_permisos.ids_empresas_permisos.rowcount()> 0 then
	guo_permisos.ids_empresas_permisos.rowscopy(1,guo_permisos.ids_empresas_permisos.rowcount(),Primary!,lds_empresas,1,Primary!)
end if

guo_permisos.ids_empresas_permisos.setfilter("")
guo_permisos.ids_empresas_permisos.filter()

return lds_empresas

end function

public function uo_ds uf_dame_centros_filtrados (string as_filtro);String ls_filtro
uo_ds lds_centros

lds_centros = CREATE uo_ds
lds_centros.DataObject = guo_permisos.ids_centros_permisos.DataObject
lds_centros.SetTransObject ( LOCAL )

ls_filtro = as_filtro

IF Isnull( ls_filtro) THEN
	ls_filtro = ''
END IF

guo_permisos.ids_centros_permisos.SetFilter ( ls_filtro )
guo_permisos.ids_centros_permisos.Filter ( )

IF guo_permisos.ids_centros_permisos.RowCount ( ) > 0 THEN
	guo_permisos.ids_centros_permisos.RowsCopy ( 1, guo_permisos.ids_centros_permisos.RowCount ( ), Primary!, lds_centros, 1, Primary! )
END IF

guo_permisos.ids_centros_permisos.SetFilter("")
guo_permisos.ids_centros_permisos.Filter ( )

RETURN lds_centros
end function

public function uo_ds uf_dame_permisos_filtrados(string as_filtro);uo_ds lds_permisos

lds_permisos=create uo_ds
lds_permisos.dataobject=guo_permisos.ids_permisos_completos.dataobject
lds_permisos.settransobject(LOCAL)

guo_permisos.ids_permisos_completos.setfilter(as_filtro)
guo_permisos.ids_permisos_completos.filter()

if guo_permisos.ids_permisos_completos.rowcount()> 0 then
	guo_permisos.ids_permisos_completos.rowscopy(1,guo_permisos.ids_permisos_completos.rowcount(),Primary!,lds_permisos,1,Primary!)
end if

guo_permisos.ids_permisos_completos.setfilter("")
guo_permisos.ids_permisos_completos.filter()

return lds_permisos

end function

public function string uf_permiso_imu(string as_usuario,long al_centro,long al_permiso);
RETURN _uf_permiso(as_usuario,al_centro,al_permiso,'IMU','')

end function

public function string uf_permiso_elemento_menu(string as_usuario,long al_centro,string as_classname);
RETURN _uf_permiso(as_usuario,al_centro,0,'MENU',as_classname)

//String ls_filtro
//Long ll_fila
//
//ls_filtro =  "c_centro=" + String(al_centro)+ " AND ITEM_MODULO = " + as_classname + " AND tp_permiso = 'IMU' "
//ll_fila = ids_permisos_completos.Find(ls_filtro,1,ids_permisos_completos.RowCount())
//IF ll_fila > 0 THEN
//	RETURN ids_permisos_completos.GetItemString(ll_fila,'tp_acceso')
//ELSE
//	RETURN 'NO'
//END IF
//
end function

private function string _uf_permiso(string as_usuario,long al_centro,long al_permiso,string as_tp_permiso,string as_classname);// Consultamos los PERMISOS en la DS ids_permisos
Long ll_fila
Long ll_centro
String ls_filtro
ent_uo_permisos  lent_uo_permisos
ent_st_error lent_st_error
ent_st_permisos lent_st_permisos

// Si no está inicializado lo buscamos en BBDD
// ya que antes de logear realiza una consulta de permisos con centro 0
IF NOT ib_inicializado THEN
	lent_st_permisos = lent_uo_permisos.uf_cargar_por_pk(This, as_usuario,al_centro,al_permiso,as_tp_permiso,lent_st_error,lent_uo_permisos.SELECT_0_1_REGISTROS)
	CHOOSE CASE lent_st_error.codigo 
		CASE -1,100
		  RETURN 'NO'
	END CHOOSE				
	RETURN lent_st_permisos.tp_acceso
END IF

if as_tp_permiso <> 'MENU' then
	//APG: en los permisos CEU lo que se comprueba es que tenga permisos a ese centro
	if as_tp_permiso = 'CEU' then
		ll_centro = al_centro
	else
		//APG: Si es un permiso que tiene ámbito por centro se busca si tiene permiso para ese centro concreto,si no,para el centro defecto
		ls_filtro =  "c_permiso = '" + String(al_permiso)+ "' AND tp_permiso = '" + as_tp_permiso +  "'"
		ll_fila = ids_permisos_ambito_centro.Find(ls_filtro,1,ids_permisos_ambito_centro.RowCount())
		IF ll_fila > 0 THEN
			ll_centro = al_centro
		ELSE
			ll_centro = gstr_user.c_centro_def
		END IF
	end if
		
	ls_filtro =  "c_centro=" + String(ll_centro)+ " AND c_elemento = " + String(al_permiso)+ " AND tp_permiso = '" + as_tp_permiso + "'"
else
	ls_filtro =  "c_centro=" + String(al_centro)+ " AND ITEM_MODULO = '" + as_classname + "' AND tp_permiso = 'IMU' "	
end if

ll_fila = ids_permisos_completos.Find(ls_filtro,1,ids_permisos_completos.RowCount())

IF ll_fila > 0 THEN
	RETURN ids_permisos_completos.GetItemString(ll_fila,'tp_acceso')
ELSE
	RETURN 'NO'
END IF

end function

on util_uo_permisos.create
call super::create
TriggerEvent( this, "constructor" )
end on

on util_uo_permisos.destroy
TriggerEvent( this, "destructor" )
call super::destroy
end on

event constructor;// acce_f_registra_uso_objeto('utilidades_uo.pbl','util_uo_permisos')
// Constructor
end event

event destructor;IF IsValid(ids_permisos)THEN
	DESTROY ids_permisos
END IF

IF IsValid(ids_permisos_sol)THEN
	DESTROY ids_permisos_sol
END IF

IF IsValid(ids_permisos_completos)THEN
	DESTROY ids_permisos_completos
END IF

IF IsValid(ids_permisos_ambito_centro)THEN
	DESTROY ids_permisos_ambito_centro
END IF

IF IsValid(ids_empresas_permisos)THEN
	DESTROY ids_empresas_permisos
END IF

IF IsValid(ids_centros_permisos)THEN
	DESTROY ids_centros_permisos
END IF
end event

