import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function NoAccess() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-red-900/50 to-red-800/50 border-red-600 border-2 text-center">
          <CardContent className="p-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Shield className="w-20 h-20 mx-auto text-red-500 mb-6" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-3xl font-bold mb-4 text-red-400">
                ERİŞİM ENGELLENDİ
              </h1>
              <p className="text-lg text-red-300 mb-8 max-w-md mx-auto">
                Bu sayfaya erişmek için yeterli yetkiye sahip değilsiniz. 
                Lütfen yöneticinizle iletişime geçin.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <Link to={createPageUrl("GetAuthorization")}>
                <Button className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold text-lg px-8 py-3 mr-4">
                  <Crown className="w-5 h-5 mr-2" />
                  VIP Yetki Al
                </Button>
              </Link>
              
              <Link to={createPageUrl("Dashboard")}>
                <Button variant="outline" className="border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Ana Sayfaya Dön
                </Button>
              </Link>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}