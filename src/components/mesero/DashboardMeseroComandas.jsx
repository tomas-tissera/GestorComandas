import React, { useEffect, useState, useMemo } from "react";
import { useComandas } from "../../hooks/useComandas";
import { useProductos } from "../../hooks/useProductos";
import { getAuth } from "firebase/auth";

// Importar componentes de Recharts
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// Helper para formatear moneda
const formatCurrency = (amount) => {
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

export default function DashboardMeseroPerformance() {
  const fetchedComandas = useComandas();
  const fetchedProductos = useProductos();

  const allComandas = fetchedComandas || [];
  const allProductos = fetchedProductos || [];

  const loadingComandas = fetchedComandas === undefined || fetchedComandas === null;
  const loadingProductos = fetchedProductos === undefined || fetchedProductos === null;

  const auth = getAuth();
  const idMeseroLogueado = auth.currentUser?.uid;

  const [comandasDelMeseroLogueado, setComandasDelMeseroLogueado] = useState([]);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    if (auth.currentUser !== undefined) {
      setUserLoaded(true);
    }

    if (idMeseroLogueado && allComandas.length > 0) {
      const filtradas = allComandas.filter(
        (comanda) => comanda.meseroId === idMeseroLogueado
      );
      setComandasDelMeseroLogueado(filtradas);
    } else {
      setComandasDelMeseroLogueado([]);
    }
  }, [idMeseroLogueado, allComandas, auth.currentUser]);

  const calcularTotalComanda = (comanda) => {
    if (!comanda || !Array.isArray(comanda.productos) || allProductos.length === 0) return 0;

    return comanda.productos.reduce((total, prod) => {
      const productoInfo = allProductos.find((p) => p.id === prod.productoId);
      if (!productoInfo) {
        console.warn(`Producto con ID ${prod.productoId} no encontrado.`);
        return total;
      }
      const precio = parseFloat(productoInfo.precio) || 0;
      const cantidad = parseFloat(prod.cantidad) || 0;
      return total + (precio * cantidad);
    }, 0);
  };

  // --- SE HAN AÑADIDO VALORES POR DEFECTO EN LA DESESTRUCTURACIÓN ---
  // Esto asegura que las variables siempre tengan un valor (vacío o cero)
  // incluso si useMemo por alguna razón inusual no retorna el objeto esperado.
  const {
    comandasPorMesData = [],
    ventasPorMesData = [],
    totalComandasMesero = 0,
    totalVentasMesero = 0,
    topProductosVendidos = []
  } = useMemo(() => {
    const mesesComandas = {};
    const mesesVentas = {};
    let totalComandas = 0;
    let totalVentas = 0;
    const productosVendidosCount = {};

    comandasDelMeseroLogueado.forEach((comanda) => {
      if (!comanda.fechaPago) return;

      let fecha;
      try {
        const isoDate = new Date(comanda.fechaPago);
        if (!isNaN(isoDate.getTime())) {
          fecha = isoDate;
        } else {
          const partes = comanda.fechaPago.split("/");
          if (partes.length === 3) {
            fecha = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
          } else {
            return;
          }
        }
        if (isNaN(fecha.getTime())) return;
      } catch (e) {
        console.warn("Error parsing fechaPago:", comanda.fechaPago, e);
        return;
      }

      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;

      mesesComandas[key] = (mesesComandas[key] || 0) + 1;

      totalComandas++;
      const comandaTotal = calcularTotalComanda(comanda);
      totalVentas += comandaTotal;

      mesesVentas[key] = (mesesVentas[key] || 0) + comandaTotal;

      if (allProductos.length > 0) {
        comanda.productos.forEach(prod => {
          const productoInfo = allProductos.find(p => p.id === prod.productoId);
          if (productoInfo) {
            const cantidad = parseFloat(prod.cantidad) || 0;
            productosVendidosCount[productoInfo.nombre] = (productosVendidosCount[productoInfo.nombre] || 0) + cantidad;
          }
        });
      }
    });

    const finalComandasPorMesData = Object.entries(mesesComandas)
      .map(([mes, cantidad]) => ({ mes, cantidad }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    const finalVentasPorMesData = Object.entries(mesesVentas)
      .map(([mes, monto]) => ({ mes, monto }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    const finalSortedProductos = Object.entries(productosVendidosCount)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3);

    return {
      comandasPorMesData: finalComandasPorMesData,
      ventasPorMesData: finalVentasPorMesData,
      totalComandasMesero: totalComandas,
      totalVentasMesero: totalVentas,
      topProductosVendidos: finalSortedProductos
    };
  }, [comandasDelMeseroLogueado, allProductos]);

  const isLoading = !userLoaded || loadingComandas || loadingProductos;

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        margin: '20px auto',
        maxWidth: '1200px',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="spinner" style={{
          border: '4px solid rgba(0, 0, 0, 0.1)',
          borderLeftColor: '#8884d8',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#555', fontSize: '18px' }}>Cargando datos de desempeño...</p>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!idMeseroLogueado) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#777', fontSize: '18px' }}>
        No se pudo cargar la información del mesero. Por favor, inicia sesión.
      </div>
    );
  }

  return (
    <section style={{
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      margin: '20px auto',
      maxWidth: '1200px'
    }}>
      <h3 style={{
        textAlign: 'center',
        color: '#333',
        marginBottom: '30px',
        fontSize: '28px',
        borderBottom: '2px solid #f0f0f0',
        paddingBottom: '15px'
      }}>
        Tu Desempeño como Mesero
      </h3>

      {/* Tarjetas de Métricas Clave */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          backgroundColor: '#e6f7ff',
          padding: '20px',
          borderRadius: '10px',
          flex: '1 1 280px',
          minWidth: '250px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderLeft: '5px solid #1890ff'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1890ff', fontSize: '18px' }}>Total de Comandas</h4>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#333' }}>
            {totalComandasMesero}
          </p>
        </div>

        <div style={{
          backgroundColor: '#f6ffed',
          padding: '20px',
          borderRadius: '10px',
          flex: '1 1 280px',
          minWidth: '250px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderLeft: '5px solid #52c41a'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#52c41a', fontSize: '18px' }}>Ventas Totales Generadas</h4>
          <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#333' }}>
            {formatCurrency(totalVentasMesero)}
          </p>
        </div>

        <div style={{
          backgroundColor: '#fff0f6',
          padding: '20px',
          borderRadius: '10px',
          flex: '1 1 280px',
          minWidth: '250px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderLeft: '5px solid #eb2f96'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#eb2f96', fontSize: '18px' }}>Tus Productos Más Vendidos</h4>
          {topProductosVendidos.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '18px', color: '#555' }}>
              {topProductosVendidos.map((prod, index) => (
                <li key={index} style={{ marginBottom: '5px' }}>
                  **{prod.nombre}** ({prod.cantidad} unidades)
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '16px', color: '#777' }}>Sin ventas de productos aún.</p>
          )}
        </div>
      </div>

      {/* Sección del Gráfico de Comandas por Mes */}
      <h4 style={{
        textAlign: 'center',
        color: '#333',
        marginBottom: '25px',
        fontSize: '22px',
        marginTop: '40px',
        borderTop: '1px solid #f0f0f0',
        paddingTop: '20px'
      }}>
        Cantidad de Comandas Creadas por Mes
      </h4>

      {comandasPorMesData.length === 0 ? (
        <p style={{
          textAlign: 'center',
          color: '#777',
          fontSize: '16px',
          padding: '20px'
        }}>
          No hay datos de comandas para tu usuario en los últimos meses.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={comandasPorMesData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" />
            <YAxis allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              formatter={(value) => `${value} Comandas`}
            />
            <Bar dataKey="cantidad" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Sección del Gráfico de Total Vendido por Mes */}
      <h4 style={{
        textAlign: 'center',
        color: '#333',
        marginBottom: '25px',
        fontSize: '22px',
        marginTop: '40px',
        borderTop: '1px solid #f0f0f0',
        paddingTop: '20px'
      }}>
        Total Vendido por Mes (Generado por Ti)
      </h4>

      {ventasPorMesData.length === 0 ? (
        <p style={{
          textAlign: 'center',
          color: '#777',
          fontSize: '16px',
          padding: '20px'
        }}>
          No hay datos de ventas para tu usuario en los últimos meses.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={ventasPorMesData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" />
            <YAxis
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              formatter={(value) => formatCurrency(value)}
            />
            <Bar dataKey="monto" fill="#52c41a" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}