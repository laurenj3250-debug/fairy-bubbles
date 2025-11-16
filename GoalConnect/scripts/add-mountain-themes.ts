import fs from 'fs';

const colorSchemes: Record<string, any> = {
  "Mount Whitney": {
    backgroundImage: "/backgrounds/mount-whitney.png",
    themeColors: {
      primary: "#95A5A6",
      secondary: "#34495E",
      accent: "#3498DB",
      gradient: "from-slate-700 via-blue-800 to-sky-600"
    }
  },
  "Mount Kenya (Batian)": {
    backgroundImage: "/backgrounds/mount-kenya.png",
    themeColors: {
      primary: "#16A085",
      secondary: "#8B4513",
      accent: "#E8F8F5",
      gradient: "from-teal-800 via-green-700 to-cyan-100"
    }
  },
  "Pico de Orizaba": {
    backgroundImage: "/backgrounds/pico-de-orizaba.png",
    themeColors: {
      primary: "#E67E22",
      secondary: "#2C3E50",
      accent: "#F4ECE6",
      gradient: "from-orange-700 via-slate-800 to-amber-50"
    }
  },
  "Mont Blanc": {
    backgroundImage: "/backgrounds/mont-blanc.png",
    themeColors: {
      primary: "#ECF0F1",
      secondary: "#3498DB",
      accent: "#F39C12",
      gradient: "from-slate-100 via-blue-400 to-amber-500"
    }
  },
  "Gran Paradiso": {
    backgroundImage: "/backgrounds/gran-paradiso.png",
    themeColors: {
      primary: "#3498DB",
      secondary: "#27AE60",
      accent: "#F8F9FA",
      gradient: "from-blue-600 via-emerald-500 to-slate-50"
    }
  },
  "Island Peak (Imja Tse)": {
    backgroundImage: "/backgrounds/island-peak.png",
    themeColors: {
      primary: "#5DADE2",
      secondary: "#2C3E50",
      accent: "#F8C471",
      gradient: "from-blue-400 via-slate-800 to-amber-300"
    }
  },
  "Mera Peak": {
    backgroundImage: "/backgrounds/mera-peak.png",
    themeColors: {
      primary: "#85C1E9",
      secondary: "#F8F9FA",
      accent: "#F1C40F",
      gradient: "from-blue-300 via-slate-50 to-yellow-400"
    }
  },
  "Mount Rainier": {
    backgroundImage: "/backgrounds/mount-rainier.png",
    themeColors: {
      primary: "#AED6F1",
      secondary: "#34495E",
      accent: "#D5DBDB",
      gradient: "from-blue-300 via-slate-700 to-slate-300"
    }
  },
  "Mount Elbrus": {
    backgroundImage: "/backgrounds/mount-elbrus.png",
    themeColors: {
      primary: "#AED6F1",
      secondary: "#566573",
      accent: "#D5D8DC",
      gradient: "from-blue-200 via-slate-600 to-slate-200"
    }
  },
  "Mount Baker": {
    backgroundImage: "/backgrounds/mount-baker.png",
    themeColors: {
      primary: "#5DADE2",
      secondary: "#AAB7B8",
      accent: "#FDEBD0",
      gradient: "from-blue-400 via-slate-300 to-amber-100"
    }
  },
  "Mount Shasta": {
    backgroundImage: "/backgrounds/mount-shasta.png",
    themeColors: {
      primary: "#9B59B6",
      secondary: "#ECF0F1",
      accent: "#1ABC9C",
      gradient: "from-purple-700 via-slate-100 to-teal-500"
    }
  },
  "Chopicalqui": {
    backgroundImage: "/backgrounds/chopicalqui.png",
    themeColors: {
      primary: "#5DADE2",
      secondary: "#E8F8F5",
      accent: "#48C9B0",
      gradient: "from-blue-400 via-cyan-50 to-teal-400"
    }
  },
  "Aoraki / Mount Cook": {
    backgroundImage: "/backgrounds/aoraki-mount-cook.png",
    themeColors: {
      primary: "#5DADE2",
      secondary: "#34495E",
      accent: "#A3E4D7",
      gradient: "from-blue-400 via-slate-700 to-teal-200"
    }
  },
  "Denali (Mount McKinley)": {
    backgroundImage: "/backgrounds/denali.png",
    themeColors: {
      primary: "#D6EAF8",
      secondary: "#212F3C",
      accent: "#85C1E9",
      gradient: "from-blue-100 via-slate-900 to-blue-300"
    }
  },
  "Cho Oyu": {
    backgroundImage: "/backgrounds/cho-oyu.png",
    themeColors: {
      primary: "#48C9B0",
      secondary: "#F8F9FA",
      accent: "#F4D03F",
      gradient: "from-teal-400 via-slate-50 to-yellow-400"
    }
  },
  "Mount Vinson": {
    backgroundImage: "/backgrounds/mount-vinson.png",
    themeColors: {
      primary: "#EBF5FB",
      secondary: "#5DADE2",
      accent: "#AEB6BF",
      gradient: "from-blue-50 via-blue-400 to-slate-400"
    }
  },
  "Gasherbrum II": {
    backgroundImage: "/backgrounds/gasherbrum-ii.png",
    themeColors: {
      primary: "#F8F9FA",
      secondary: "#5499C7",
      accent: "#AAB7B8",
      gradient: "from-slate-50 via-blue-500 to-slate-400"
    }
  },
  "Broad Peak": {
    backgroundImage: "/backgrounds/broad-peak.png",
    themeColors: {
      primary: "#D5DBDB",
      secondary: "#2874A6",
      accent: "#85929E",
      gradient: "from-slate-200 via-blue-700 to-slate-500"
    }
  },
  "Shishapangma": {
    backgroundImage: "/backgrounds/shishapangma.png",
    themeColors: {
      primary: "#5DADE2",
      secondary: "#D5DBDB",
      accent: "#F39C12",
      gradient: "from-blue-400 via-slate-200 to-amber-600"
    }
  },
  "Manaslu": {
    backgroundImage: "/backgrounds/manaslu.png",
    themeColors: {
      primary: "#9B59B6",
      secondary: "#ECF0F1",
      accent: "#F4D03F",
      gradient: "from-purple-600 via-slate-100 to-yellow-400"
    }
  },
  "Dhaulagiri": {
    backgroundImage: "/backgrounds/dhaulagiri.png",
    themeColors: {
      primary: "#ECF0F1",
      secondary: "#154360",
      accent: "#5DADE2",
      gradient: "from-slate-100 via-blue-900 to-blue-400"
    }
  },
  "Nanga Parbat": {
    backgroundImage: "/backgrounds/nanga-parbat.png",
    themeColors: {
      primary: "#E74C3C",
      secondary: "#2C3E50",
      accent: "#F8F9FA",
      gradient: "from-red-700 via-slate-900 to-slate-100"
    }
  },
  "Makalu": {
    backgroundImage: "/backgrounds/makalu.png",
    themeColors: {
      primary: "#2C3E50",
      secondary: "#AED6F1",
      accent: "#F39C12",
      gradient: "from-slate-900 via-blue-300 to-amber-600"
    }
  },
  "Lhotse": {
    backgroundImage: "/backgrounds/lhotse.png",
    themeColors: {
      primary: "#5499C7",
      secondary: "#D5DBDB",
      accent: "#F8C471",
      gradient: "from-blue-500 via-slate-200 to-amber-300"
    }
  },
  "Kangchenjunga": {
    backgroundImage: "/backgrounds/kangchenjunga.png",
    themeColors: {
      primary: "#F4D03F",
      secondary: "#F8F9FA",
      accent: "#E74C3C",
      gradient: "from-yellow-400 via-slate-50 to-red-700"
    }
  },
  "Mount Everest": {
    backgroundImage: "/backgrounds/mount-everest.png",
    themeColors: {
      primary: "#2C3E50",
      secondary: "#F39C12",
      accent: "#ECF0F1",
      gradient: "from-slate-900 via-amber-600 to-slate-100"
    }
  },
  "K2": {
    backgroundImage: "/backgrounds/k2.png",
    themeColors: {
      primary: "#212F3C",
      secondary: "#E74C3C",
      accent: "#85929E",
      gradient: "from-slate-950 via-red-800 to-slate-500"
    }
  },
  "Annapurna I": {
    backgroundImage: "/backgrounds/annapurna-i.png",
    themeColors: {
      primary: "#E74C3C",
      secondary: "#34495E",
      accent: "#F8F9FA",
      gradient: "from-red-800 via-slate-800 to-slate-100"
    }
  },
  "Matterhorn": {
    backgroundImage: "/backgrounds/matterhorn.png",
    themeColors: {
      primary: "#566573",
      secondary: "#E74C3C",
      accent: "#ECF0F1",
      gradient: "from-slate-600 via-red-700 to-slate-100"
    }
  },
  "Eiger North Face": {
    backgroundImage: "/backgrounds/eiger-north-face.png",
    themeColors: {
      primary: "#2C3E50",
      secondary: "#E8F8F5",
      accent: "#E74C3C",
      gradient: "from-slate-900 via-cyan-50 to-red-700"
    }
  },
  "Grandes Jorasses North Face": {
    backgroundImage: "/backgrounds/grandes-jorasses.png",
    themeColors: {
      primary: "#34495E",
      secondary: "#AED6F1",
      accent: "#BDC3C7",
      gradient: "from-slate-700 via-blue-300 to-slate-300"
    }
  },
  "Ama Dablam": {
    backgroundImage: "/backgrounds/ama-dablam.png",
    themeColors: {
      primary: "#F39C12",
      secondary: "#2C3E50",
      accent: "#AED6F1",
      gradient: "from-amber-600 via-slate-900 to-blue-300"
    }
  },
  "Aconcagua": {
    backgroundImage: "/backgrounds/aconcagua.png",
    themeColors: {
      primary: "#95A5A6",
      secondary: "#5D6D7E",
      accent: "#FAD7A0",
      gradient: "from-slate-400 via-slate-600 to-amber-200"
    }
  },
  "Cotopaxi": {
    backgroundImage: "/backgrounds/cotopaxi.png",
    themeColors: {
      primary: "#E67E22",
      secondary: "#2C3E50",
      accent: "#F8F9FA",
      gradient: "from-orange-600 via-slate-900 to-slate-100"
    }
  },
  "Huayna Potosi": {
    backgroundImage: "/backgrounds/huayna-potosi.png",
    themeColors: {
      primary: "#5499C7",
      secondary: "#273746",
      accent: "#F8C471",
      gradient: "from-blue-500 via-slate-900 to-amber-300"
    }
  },
  "Chimborazo": {
    backgroundImage: "/backgrounds/chimborazo.png",
    themeColors: {
      primary: "#87CEEB",
      secondary: "#8B4513",
      accent: "#FFFAF0",
      gradient: "from-sky-400 via-orange-800 to-orange-50"
    }
  },
  "Damavand": {
    backgroundImage: "/backgrounds/damavand.png",
    themeColors: {
      primary: "#E74C3C",
      secondary: "#F4D03F",
      accent: "#D5DBDB",
      gradient: "from-red-700 via-yellow-500 to-slate-200"
    }
  },
  "Nevado Pisco": {
    backgroundImage: "/backgrounds/nevado-pisco.png",
    themeColors: {
      primary: "#3498DB",
      secondary: "#F8F9FA",
      accent: "#52BE80",
      gradient: "from-blue-600 via-slate-50 to-emerald-500"
    }
  }
};

console.log("✅ Color schemes ready for", Object.keys(colorSchemes).length, "mountains");
console.log("📝 To apply: manually update seed file with these theme colors");
console.log("\nExample format:");
console.log(`
      backgroundImage: "/backgrounds/mount-name.png",
      themeColors: JSON.stringify({
        primary: "#HEXCODE",
        secondary: "#HEXCODE",
        accent: "#HEXCODE",
        gradient: "from-color via-color to-color"
      })
`);
