import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Image, Smile, MapPin, Globe } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postService } from "@/services/mockApi";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";


type Privacy = "public" | "almost_private" | "private";


export function CreatePost() {
   const [content, setContent] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("public");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedViewers, setSelectedViewers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatar, setAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);


  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState("");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => postService.createPost({ text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      setText("");
      toast.success("Post shared");
    },
  });

   const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

   const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Post content cannot be empty");
      return;
    }

    if (privacy === "private" && selectedViewers.length === 0) {
      setError("Please select at least one follower for a private post");
      return;
    }


    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("privacy", privacy);
      formData.append("viewers", JSON.stringify(selectedViewers));
      if (image) formData.append("image", image);

      const res = await fetch("http://localhost:8080/posts", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      console.log(res)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create post");
      }

      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

console.log(user)

  if (!user) return null;

  return (
    <div className="surface-card p-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar ? `http://localhost:8080/${user.avatar}` : undefined} alt={user.firstname} />
          <AvatarFallback>{user?.firstname?.[0]}</AvatarFallback>
        </Avatar>

       <form onSubmit={handleSubmit} className="space-y-5">

        <div className="flex-1 min-w-0">
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's on your mind, ${user.firstname?.split(" ")[0]}?`}
            rows={2}
            className="w-full resize-none bg-transparent text-[15px] placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-3">
  {avatarPreview && (
    <img
      src={avatarPreview}
      alt="Avatar preview"
      className="h-12 w-12 rounded-full object-cover border"
    />
  )}

  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={() => fileInputRef.current?.click()}
  >
    <Image className="h-4 w-4 mr-2" />
    Choose Image
  </Button>

  <Input
    ref={fileInputRef}
    type="file"
    accept="image/jpeg,image/png,image/gif"
    onChange={handleAvatarChange}
    className="hidden"
  />
</div>
              {/* <div className="space-y-1.5">
          <Label>
            Avatar <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <div className="flex items-center gap-3">
            {avatarPreview && (
              <img
                src={avatarPreview}
                alt="avatar preview"
                // className="h-12 w-12 rounded-full object-cover border"
              />
            )}
            <Input type="file" accept="image/jpeg,image/png,image/gif" onChange={handleAvatarChange} />
          </div>
        </div> */}
              {/* <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 h-8">
                <Smile className="h-4 w-4" /> <span className="hidden sm:inline">Feeling</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 h-8">
                <MapPin className="h-4 w-4" /> <span className="hidden sm:inline">Location</span>
              </Button> */}
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 h-8">
                <Globe className="h-4 w-4" /> <span className="hidden sm:inline">Public</span>
              </Button>
            </div>
            <Button
              size="sm"
              type="submit"
              disabled={!content.trim() || isLoading}
              // onClick={handleSubmit}
            >
              {mut.isPending ? "Posting…" : "Post"}
            </Button>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
}
