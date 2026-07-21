import { useEffect, useState } from "react";
import {
  Plus, Edit, Trash2, Save, Loader, ChevronLeft, ChevronRight, Building2
} from "lucide-react";
import Modal from "@/components/ui/modal";
import { facultyApi, type Faculty } from "@/api/client";
import { useToast } from "@/hooks/useToast";

export default function FakultasSection() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Faculty | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();
  const itemsPerPage = 8;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await facultyApi.list();
      setFaculties(res.data || []);
    } catch (err) {
      error("Gagal memuat data fakultas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditing(null);
    setFormData({ name: "", code: "" });
    setIsModalOpen(true);
  };

  const openEdit = (fac: Faculty) => {
    setEditing(fac);
    setFormData({ name: fac.name, code: fac.code || "" });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { error("Nama fakultas wajib diisi"); return; }
    setIsSubmitting(true);
    try {
      if (editing) {
        await facultyApi.update(editing.id, formData);
        success("Fakultas diperbarui");
      } else {
        await facultyApi.create(formData);
        success("Fakultas ditambahkan");
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      error(err?.message || "Gagal menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus fakultas "${name}"?`)) return;
    try {
      await facultyApi.delete(id);
      success("Fakultas dihapus");
      await fetchData();
    } catch (err: any) {
      error(err?.message || "Gagal menghapus");
    }
  };

  const totalPages = Math.max(1, Math.ceil(faculties.length / itemsPerPage));
  const paginated = faculties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="size-5 text-primary" /> Manajemen Fakultas
        </h2>
        <button onClick={openAdd} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/95 transition-all flex items-center gap-2">
          <Plus className="size-4" /> Tambah Fakultas
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader className="size-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-muted/70 text-muted-foreground text-xs uppercase font-bold border-b border-border">
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama Fakultas</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Belum ada data</td></tr>
                ) : paginated.map((fac) => (
                  <tr key={fac.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{fac.code || "-"}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{fac.name}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(fac)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Edit className="size-4" /></button>
                      <button onClick={() => handleDelete(fac.id, fac.name)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="size-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-30"><ChevronLeft className="size-4" /></button>
              <span className="text-sm text-muted-foreground">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-30"><ChevronRight className="size-4" /></button>
            </div>
          )}
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "Edit Fakultas" : "Tambah Fakultas"}>
        <div className="space-y-4 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Nama Fakultas *</label>
            <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Kode</label>
            <input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="Opsional" className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background" />
          </div>
          <button onClick={handleSave} disabled={isSubmitting} className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary/95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {isSubmitting && <Loader className="size-4 animate-spin" />}
            <Save className="size-4" /> {editing ? "Perbarui" : "Simpan"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
